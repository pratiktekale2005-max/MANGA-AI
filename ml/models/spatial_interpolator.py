"""
Model 3: Spatial Estimation Engine
Implements Inverse Distance Weighting (IDW), Ordinary Kriging (Gaussian Process Spatial Regressor),
and ML Spatial Estimation for continuous manganese grade surfaces.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from scipy.spatial.distance import cdist
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel as C, WhiteKernel
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


class SpatialInterpolator:
    """Spatial interpolation and comparative surface estimation engine."""

    def __init__(self, p_idw: float = 2.0):
        self.p_idw = p_idw
        self.kriging_model = None
        self.ml_spatial_model = None
        self.coords_train = None
        self.values_train = None

    def fit(self, df_points: pd.DataFrame, x_col: str = "x", y_col: str = "y", val_col: str = "mn_grade"):
        """Fits spatial models on sampled assay point coordinates."""
        coords = df_points[[x_col, y_col]].values
        values = df_points[val_col].values

        self.coords_train = coords
        self.values_train = values

        # 1. Ordinary Kriging approximation via Gaussian Process with fixed RBF variogram (fast & robust)
        kernel = C(100.0) * RBF(length_scale=350.0) + WhiteKernel(noise_level=4.0)
        self.kriging_model = GaussianProcessRegressor(kernel=kernel, optimizer=None, random_state=42)
        self.kriging_model.fit(coords, values)

        # 2. ML Spatial Estimator (k-NN distance weighted)
        self.ml_spatial_model = KNeighborsRegressor(n_neighbors=min(8, len(coords)), weights="distance")
        self.ml_spatial_model.fit(coords, values)

    def idw_predict(self, query_coords: np.ndarray) -> np.ndarray:
        """Inverse Distance Weighting interpolation."""
        dists = cdist(query_coords, self.coords_train)
        dists = np.maximum(dists, 1e-4)
        weights = 1.0 / (dists ** self.p_idw)
        weights_sum = weights.sum(axis=1, keepdims=True)
        return (weights @ self.values_train) / weights_sum.ravel()

    def kriging_predict(self, query_coords: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Kriging prediction with spatial estimation variance / uncertainty."""
        preds, std = self.kriging_model.predict(query_coords, return_std=True)
        return np.clip(preds, 0.0, 55.0), std

    def ml_predict(self, query_coords: np.ndarray) -> np.ndarray:
        """ML spatial estimation."""
        return np.clip(self.ml_spatial_model.predict(query_coords), 0.0, 55.0)

    def evaluate_methods(self, df_points: pd.DataFrame, x_col: str = "x", y_col: str = "y", val_col: str = "mn_grade") -> Dict[str, Any]:
        """Spatial cross-validation comparison."""
        coords = df_points[[x_col, y_col]].values
        y_true = df_points[val_col].values
        n = len(coords)

        idw_preds = []
        krig_preds = []
        ml_preds = []

        indices = np.arange(n)
        np.random.seed(42)
        np.random.shuffle(indices)
        folds = np.array_split(indices, 5)

        for fold in folds:
            train_idx = np.setdiff1d(indices, fold)
            val_idx = fold

            X_tr, y_tr = coords[train_idx], y_true[train_idx]
            X_val = coords[val_idx]

            # IDW on train fold
            dists = np.maximum(cdist(X_val, X_tr), 1e-4)
            w = 1.0 / (dists ** self.p_idw)
            idw_fold = (w @ y_tr) / w.sum(axis=1, keepdims=True).ravel()
            idw_preds.extend(idw_fold)

            # Kriging on train fold
            kr = GaussianProcessRegressor(
                kernel=C(100.0) * RBF(length_scale=350.0) + WhiteKernel(noise_level=4.0),
                optimizer=None,
                random_state=42
            )
            kr.fit(X_tr, y_tr)
            krig_preds.extend(kr.predict(X_val))

            # ML spatial
            knn = KNeighborsRegressor(n_neighbors=min(6, len(X_tr)), weights="distance")
            knn.fit(X_tr, y_tr)
            ml_preds.extend(knn.predict(X_val))

        y_eval = y_true[indices]
        idw_preds = np.array(idw_preds)
        krig_preds = np.array(krig_preds)
        ml_preds = np.array(ml_preds)

        results = {
            "IDW (Inverse Distance Weighting)": {
                "r2_score": round(float(r2_score(y_eval, idw_preds)), 4),
                "rmse": round(float(np.sqrt(mean_squared_error(y_eval, idw_preds))), 3),
                "mae": round(float(mean_absolute_error(y_eval, idw_preds)), 3),
                "method_type": "Deterministic Distance Decay"
            },
            "Ordinary Kriging (Gaussian Process)": {
                "r2_score": round(float(r2_score(y_eval, krig_preds)), 4),
                "rmse": round(float(np.sqrt(mean_squared_error(y_eval, krig_preds))), 3),
                "mae": round(float(mean_absolute_error(y_eval, krig_preds)), 3),
                "method_type": "Geostatistical Variogram Optimization"
            },
            "ML Spatial Regressor": {
                "r2_score": round(float(r2_score(y_eval, ml_preds)), 4),
                "rmse": round(float(np.sqrt(mean_squared_error(y_eval, ml_preds))), 3),
                "mae": round(float(mean_absolute_error(y_eval, ml_preds)), 3),
                "method_type": "Nonlinear Neighborhood ML"
            }
        }
        return results

    def generate_grid_surface(self, x_range: Tuple[float, float], y_range: Tuple[float, float], grid_res: int = 20) -> Dict[str, Any]:
        """Generates continuous interpolated 2D grid surface for interactive map heatmap."""
        xs = np.linspace(x_range[0], x_range[1], grid_res)
        ys = np.linspace(y_range[0], y_range[1], grid_res)
        grid_x, grid_y = np.meshgrid(xs, ys)
        flat_coords = np.column_stack([grid_x.ravel(), grid_y.ravel()])

        idw_grid = self.idw_predict(flat_coords).reshape(grid_x.shape)
        krig_grid, krig_std = self.kriging_predict(flat_coords)
        krig_grid = krig_grid.reshape(grid_x.shape)
        krig_std = krig_std.reshape(grid_x.shape)
        ml_grid = self.ml_predict(flat_coords).reshape(grid_x.shape)

        return {
            "x_coords": xs.tolist(),
            "y_coords": ys.tolist(),
            "idw_surface": idw_grid.round(2).tolist(),
            "kriging_surface": krig_grid.round(2).tolist(),
            "kriging_uncertainty": krig_std.round(2).tolist(),
            "ml_surface": ml_grid.round(2).tolist()
        }
