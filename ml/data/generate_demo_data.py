"""
Demo Dataset Generator for MOIL Manganese Mine Intelligence Platform
Generates realistic geological, drillhole, production, equipment, and satellite data
representing authentic Sausar Group / Central Indian Manganese Belt characteristics.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "synthetic_store")

MINES = [
    {
        "mine_id": "MOIL-DB-01",
        "name": "Dongri Buzurg Mine",
        "type": "Open Cast & Underground",
        "district": "Bhandara",
        "state": "Maharashtra",
        "center_lat": 21.5478,
        "center_lon": 79.7042,
        "base_elevation": 320.0,
        "avg_mn_grade": 40.5,
        "formation": "Mansar Formation (Sausar Group)",
        "mineralogy": "Pyrolusite, Psilomelane, Braunite",
        "monthly_capacity_tonnes": 35000
    },
    {
        "mine_id": "MOIL-BL-03",
        "name": "Balaghat Mine",
        "type": "Deep Underground (Shaft)",
        "district": "Balaghat",
        "state": "Madhya Pradesh",
        "center_lat": 21.8125,
        "center_lon": 80.1856,
        "base_elevation": 345.0,
        "avg_mn_grade": 43.8,
        "formation": "Mansar Formation (Gondite Belt)",
        "mineralogy": "High-Grade Braunite, Holandite",
        "monthly_capacity_tonnes": 48000
    },
    {
        "mine_id": "MOIL-GM-02",
        "name": "Gumgaon Mine",
        "type": "Underground",
        "district": "Nagpur",
        "state": "Maharashtra",
        "center_lat": 21.3912,
        "center_lon": 78.9815,
        "base_elevation": 310.0,
        "avg_mn_grade": 36.2,
        "formation": "Sitasaongi & Mansar Formations",
        "mineralogy": "Braunite, Cryptomelane, Gondite Ore",
        "monthly_capacity_tonnes": 24000
    },
    {
        "mine_id": "MOIL-UK-04",
        "name": "Ukwa Mine",
        "type": "Underground & Open Slope",
        "district": "Balaghat",
        "state": "Madhya Pradesh",
        "center_lat": 21.9680,
        "center_lon": 80.4632,
        "base_elevation": 360.0,
        "avg_mn_grade": 33.4,
        "formation": "Chorbaoli / Mansar Transition",
        "mineralogy": "Bedded Manganese Silicates & Braunite",
        "monthly_capacity_tonnes": 20000
    }
]

LITHOLOGIES = [
    "High-Grade Braunite Ore",
    "Medium-Grade Pyrolusite Bed",
    "Gondite (Manganiferous Quartzite)",
    "Quartz-Muscovite Schist",
    "Banded Hematite-Manganese Quartzite",
    "Calc-Silicate Granulite",
    "Phyllite & Weathered Overburden"
]


def generate_all_datasets(seed: int = 42) -> Dict[str, str]:
    """Generates all synthetic datasets and saves them as CSV and JSON."""
    np.random.seed(seed)
    os.makedirs(DATA_DIR, exist_ok=True)
    
    file_paths = {}
    
    # 1. Mines Metadata
    mines_file = os.path.join(DATA_DIR, "mines_meta.json")
    with open(mines_file, "w") as f:
        json.dump({"dataset_type": "Demo/Synthetic Dataset", "mines": MINES}, f, indent=2)
    file_paths["mines"] = mines_file

    # 2. Drillholes & Geological Assays Dataset
    drillholes_df = _generate_drillhole_dataset()
    dh_file = os.path.join(DATA_DIR, "geological_drillholes.csv")
    drillholes_df.to_csv(dh_file, index=False)
    file_paths["drillholes"] = dh_file

    # 3. Mine Blocks Grid Dataset (Voxel Block Model)
    blocks_df = _generate_mine_blocks_dataset(drillholes_df)
    blocks_file = os.path.join(DATA_DIR, "mine_blocks_3d.csv")
    blocks_df.to_csv(blocks_file, index=False)
    file_paths["blocks"] = blocks_file

    # 4. Production History Dataset (36 Months)
    prod_df = _generate_production_dataset()
    prod_file = os.path.join(DATA_DIR, "production_history.csv")
    prod_df.to_csv(prod_file, index=False)
    file_paths["production"] = prod_file

    # 5. Equipment Fleet Performance Dataset
    eq_df = _generate_equipment_dataset()
    eq_file = os.path.join(DATA_DIR, "equipment_fleet.csv")
    eq_df.to_csv(eq_file, index=False)
    file_paths["equipment"] = eq_file

    # 6. Satellite Multi-Spectral Features Dataset
    sat_df = _generate_satellite_features_dataset()
    sat_file = os.path.join(DATA_DIR, "satellite_spectral_grid.csv")
    sat_df.to_csv(sat_file, index=False)
    file_paths["satellite"] = sat_file

    return file_paths


def _generate_drillhole_dataset() -> pd.DataFrame:
    records = []
    hole_counter = 1
    
    for mine in MINES:
        mine_id = mine["mine_id"]
        c_lat, c_lon = mine["center_lat"], mine["center_lon"]
        base_elev = mine["base_elevation"]
        target_grade = mine["avg_mn_grade"]
        
        # 75 drillholes per mine across a 2.5 km x 2.5 km grid
        n_holes = 75
        for i in range(n_holes):
            hole_id = f"DH-{mine_id[-2:]}-{hole_counter:03d}"
            hole_counter += 1
            
            # Local offset in meters (-1200m to +1200m)
            dx = np.random.uniform(-1200, 1200)
            dy = np.random.uniform(-1200, 1200)
            
            # Coordinate conversion: ~111,320 meters per degree lat, ~103,000 for lon
            lat = c_lat + (dy / 111320.0)
            lon = c_lon + (dx / 103000.0)
            collar_elev = base_elev + np.random.uniform(-15, 35)
            
            # Total borehole depth (40m to 160m)
            total_depth = np.random.uniform(50, 160)
            
            # Distance from deposit strike axis (simulate a NE-SW striking orebody)
            # Strike angle ~ 60 degrees
            strike_dist = abs(dx * np.sin(np.radians(60)) - dy * np.cos(np.radians(60)))
            ore_proximity_factor = np.exp(-strike_dist / 450.0)
            
            # Create 4 to 8 depth intervals per hole
            n_intervals = np.random.randint(4, 8)
            depth_steps = np.sort(np.random.uniform(0, total_depth, n_intervals))
            depth_steps = np.concatenate([[0.0], depth_steps, [total_depth]])
            
            for j in range(len(depth_steps) - 1):
                from_depth = round(depth_steps[j], 1)
                to_depth = round(depth_steps[j+1], 1)
                thickness = round(to_depth - from_depth, 1)
                if thickness < 1.0:
                    continue
                
                mid_depth = (from_depth + to_depth) / 2.0
                sample_elev = collar_elev - mid_depth
                
                # Ore probability based on proximity and depth (ore zone typically 20-90m depth)
                depth_ore_factor = np.exp(-((mid_depth - 55.0) ** 2) / (2 * (30.0 ** 2)))
                ore_chance = ore_proximity_factor * depth_ore_factor
                
                if ore_chance > 0.45:
                    lithology = "High-Grade Braunite Ore" if np.random.rand() > 0.35 else "Medium-Grade Pyrolusite Bed"
                    mn_base = target_grade + np.random.normal(0, 3.5)
                    fe_base = np.random.uniform(4.5, 9.5)
                    sio2_base = np.random.uniform(10.0, 22.0)
                    p_base = np.random.uniform(0.06, 0.22)
                    density_val = np.random.uniform(3.7, 4.35)
                elif ore_chance > 0.20:
                    lithology = "Gondite (Manganiferous Quartzite)" if np.random.rand() > 0.4 else "Banded Hematite-Manganese Quartzite"
                    mn_base = np.random.uniform(18.0, 31.0)
                    fe_base = np.random.uniform(8.0, 16.0)
                    sio2_base = np.random.uniform(25.0, 48.0)
                    p_base = np.random.uniform(0.12, 0.32)
                    density_val = np.random.uniform(3.2, 3.75)
                elif from_depth < 15.0:
                    lithology = "Phyllite & Weathered Overburden"
                    mn_base = np.random.uniform(2.0, 9.0)
                    fe_base = np.random.uniform(5.0, 12.0)
                    sio2_base = np.random.uniform(45.0, 68.0)
                    p_base = np.random.uniform(0.04, 0.15)
                    density_val = np.random.uniform(2.4, 2.8)
                else:
                    lithology = "Quartz-Muscovite Schist" if np.random.rand() > 0.3 else "Calc-Silicate Granulite"
                    mn_base = np.random.uniform(1.5, 12.0)
                    fe_base = np.random.uniform(3.0, 10.0)
                    sio2_base = np.random.uniform(50.0, 72.0)
                    p_base = np.random.uniform(0.05, 0.18)
                    density_val = np.random.uniform(2.65, 3.05)
                
                # Synthetic spectral indicator proxies at surface location
                iron_oxide_proxy = round(float(np.clip(1.2 + (fe_base / 8.0) + np.random.normal(0, 0.15), 0.5, 3.8)), 3)
                clay_mineral_proxy = round(float(np.clip(0.9 + (sio2_base / 35.0) + np.random.normal(0, 0.1), 0.4, 2.6)), 3)
                
                records.append({
                    "hole_id": hole_id,
                    "mine_id": mine_id,
                    "x": round(dx, 2),
                    "y": round(dy, 2),
                    "latitude": round(lat, 6),
                    "longitude": round(lon, 6),
                    "collar_elevation": round(collar_elev, 2),
                    "depth_from": from_depth,
                    "depth_to": to_depth,
                    "sample_depth": round(mid_depth, 2),
                    "sample_elevation": round(sample_elev, 2),
                    "thickness": thickness,
                    "lithology": lithology,
                    "mn_grade": round(float(np.clip(mn_base, 1.2, 54.0)), 2),
                    "fe_grade": round(float(np.clip(fe_base, 2.0, 24.0)), 2),
                    "sio2": round(float(np.clip(sio2_base, 8.0, 75.0)), 2),
                    "p_content": round(float(np.clip(p_base, 0.02, 0.45)), 4),
                    "density": round(float(density_val), 2),
                    "core_recovery_pct": round(float(np.clip(np.random.normal(92, 5), 65, 99)), 1),
                    "sat_iron_oxide": iron_oxide_proxy,
                    "sat_clay_index": clay_mineral_proxy,
                    "is_synthetic": True
                })
                
    return pd.DataFrame(records)


def _generate_mine_blocks_dataset(drillholes_df: pd.DataFrame) -> pd.DataFrame:
    """Generates 3D voxel block model regularized grid."""
    blocks = []
    
    for mine in MINES:
        mine_id = mine["mine_id"]
        c_lat, c_lon = mine["center_lat"], mine["center_lon"]
        base_elev = mine["base_elevation"]
        
        # Grid dimensions: 10 x 10 in horizontal (100m step), 4 vertical benches (15m bench height)
        xs = np.linspace(-1000, 1000, 11)
        ys = np.linspace(-1000, 1000, 11)
        benches = [base_elev - 15, base_elev - 30, base_elev - 45, base_elev - 60]
        
        for ix, x in enumerate(xs):
            for iy, y in enumerate(ys):
                # Calculate synthetic strike factor
                strike_dist = abs(x * np.sin(np.radians(60)) - y * np.cos(np.radians(60)))
                proximity = np.exp(-strike_dist / 500.0)
                
                lat = c_lat + (y / 111320.0)
                lon = c_lon + (x / 103000.0)
                
                for b_idx, z in enumerate(benches):
                    block_id = f"BLK-{mine_id[-2:]}-X{ix:02d}Y{iy:02d}-B{b_idx+1}"
                    
                    depth = base_elev - z
                    depth_factor = np.exp(-((depth - 40.0) ** 2) / (2 * (25.0 ** 2)))
                    prob = proximity * depth_factor
                    
                    if prob > 0.4:
                        est_grade = mine["avg_mn_grade"] + np.random.normal(0, 2.8)
                        density = 3.95
                        category = "High Grade Braunite"
                        unfc_code = "111 (Measured Resource)"
                        confidence = 0.88
                    elif prob > 0.2:
                        est_grade = np.random.uniform(22.0, 34.0)
                        density = 3.45
                        category = "Medium Grade Gondite"
                        unfc_code = "122 (Indicated Resource)"
                        confidence = 0.76
                    else:
                        est_grade = np.random.uniform(4.0, 18.0)
                        density = 2.85
                        category = "Low Grade / Country Rock"
                        unfc_code = "333 (Inferred / Reconnaissance)"
                        confidence = 0.62
                    
                    est_grade = round(float(np.clip(est_grade, 2.5, 52.0)), 2)
                    volume_m3 = 100.0 * 100.0 * 15.0  # 150,000 m3
                    tonnage = volume_m3 * density
                    contained_mn = round(tonnage * (est_grade / 100.0), 1)
                    
                    # Mining extraction suitability
                    stripping_ratio = round(float(depth / 20.0 + np.random.uniform(0.5, 2.5)), 2)
                    extraction_cost_per_t = round(float(450.0 + (depth * 8.5) + (stripping_ratio * 45.0)), 2)
                    
                    blocks.append({
                        "block_id": block_id,
                        "mine_id": mine_id,
                        "x": round(x, 1),
                        "y": round(y, 1),
                        "z_elevation": round(z, 1),
                        "depth_below_surface": round(depth, 1),
                        "latitude": round(lat, 6),
                        "longitude": round(lon, 6),
                        "block_volume_m3": volume_m3,
                        "rock_density_tpm3": density,
                        "total_tonnage": round(tonnage, 1),
                        "predicted_mn_grade": est_grade,
                        "contained_mn_tonnes": contained_mn,
                        "confidence_score": confidence,
                        "resource_classification": unfc_code,
                        "geological_category": category,
                        "stripping_ratio": stripping_ratio,
                        "est_extraction_cost_inr": extraction_cost_per_t,
                        "is_synthetic": True
                    })
                    
    return pd.DataFrame(blocks)


def _generate_production_dataset() -> pd.DataFrame:
    """Generates 36 months of realistic monthly mining production logs per mine."""
    records = []
    
    # 36 months from 2023-01 to 2025-12
    dates = pd.date_range(start="2023-01-01", periods=36, freq="MS")
    
    for mine in MINES:
        mine_id = mine["mine_id"]
        base_cap = mine["monthly_capacity_tonnes"]
        base_grade = mine["avg_mn_grade"]
        
        for date in dates:
            month_num = date.month
            year = date.year
            
            # Monsoon seasonality effect: July, August, September see reduced production and wet ore handling
            is_monsoon = month_num in [7, 8, 9]
            seasonal_mult = np.random.uniform(0.72, 0.84) if is_monsoon else np.random.uniform(0.94, 1.08)
            
            working_days = 22 if is_monsoon else np.random.choice([25, 26, 27])
            target_tonnes = int(base_cap * np.random.uniform(0.95, 1.05))
            target_grade = round(base_grade, 2)
            
            # Equipment availability and operational hours
            fleet_availability = round(float(np.random.uniform(76.0, 92.0) if not is_monsoon else np.random.uniform(65.0, 82.0)), 1)
            fleet_utilization = round(float(np.random.uniform(70.0, 88.0)), 1)
            scheduled_hours = working_days * 20.0
            operating_hours = round(scheduled_hours * (fleet_availability / 100.0) * (fleet_utilization / 100.0), 1)
            downtime_hours = round(scheduled_hours - operating_hours, 1)
            
            # Production output
            actual_ore_tonnes = int(target_tonnes * seasonal_mult * (fleet_availability / 88.0) * np.random.uniform(0.95, 1.02))
            waste_tonnes = int(actual_ore_tonnes * np.random.uniform(2.2, 3.8))
            actual_grade = round(float(base_grade + np.random.normal(0, 1.2)), 2)
            
            # Recovery factor & contained Mn
            recovery_pct = round(float(np.clip(np.random.normal(87.5, 2.5), 78.0, 94.0)), 1)
            recovered_mn_tonnes = round(actual_ore_tonnes * (actual_grade / 100.0) * (recovery_pct / 100.0), 1)
            
            # Shortfall calculation
            tonnage_shortfall = target_tonnes - actual_ore_tonnes
            shortfall_pct = round((tonnage_shortfall / target_tonnes) * 100.0, 1)
            
            if shortfall_pct > 15.0:
                shortfall_risk = "Critical Shortfall"
            elif shortfall_pct > 5.0:
                shortfall_risk = "Moderate Warning"
            else:
                shortfall_risk = "On Track"
                
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "year": year,
                "month": month_num,
                "mine_id": mine_id,
                "mine_name": mine["name"],
                "target_ore_tonnes": target_tonnes,
                "actual_ore_tonnes": actual_ore_tonnes,
                "waste_tonnes": waste_tonnes,
                "stripping_ratio": round(waste_tonnes / max(1, actual_ore_tonnes), 2),
                "target_mn_grade": target_grade,
                "actual_mn_grade": actual_grade,
                "recovery_pct": recovery_pct,
                "recovered_mn_tonnes": recovered_mn_tonnes,
                "working_days": working_days,
                "scheduled_hours": scheduled_hours,
                "operating_hours": operating_hours,
                "downtime_hours": downtime_hours,
                "fleet_availability_pct": fleet_availability,
                "fleet_utilization_pct": fleet_utilization,
                "tonnage_shortfall": tonnage_shortfall,
                "shortfall_pct": shortfall_pct,
                "shortfall_risk_status": shortfall_risk,
                "power_outage_hours": round(float(np.random.uniform(5, 35)), 1),
                "is_synthetic": True
            })
            
    return pd.DataFrame(records)


def _generate_equipment_dataset() -> pd.DataFrame:
    """Generates equipment fleet telemetry and maintenance metrics."""
    records = []
    
    eq_catalog = [
        ("EXC", "Hydraulic Excavator (Komatsu PC300)", 6, 280.0),
        ("DMP", "Heavy Dumper (BEML BH35)", 12, 140.0),
        ("DRL", "Blast Hole Drill Rig (Atlas Copco ROC D7)", 4, 180.0),
        ("LDR", "Front End Wheel Loader (CAT 966H)", 5, 210.0),
        ("CRU", "Primary Crushing & Screening Plant", 2, 450.0),
        ("LHD", "Underground Load Haul Dumper (Sandvik LH307)", 6, 220.0)
    ]
    
    for mine in MINES:
        mine_id = mine["mine_id"]
        
        for prefix, model, count, capacity_tph in eq_catalog:
            # Skip underground specific machines for pure opencast or vice versa if needed
            for i in range(1, count + 1):
                eq_id = f"{prefix}-{mine_id[-2:]}-{i:02d}"
                
                # Equipment age and total runtime
                age_years = np.random.uniform(1.5, 8.5)
                lifetime_hours = int(age_years * 3200 + np.random.uniform(0, 1500))
                
                # Monthly performance telemetry (last 30 days)
                calendar_hours = 720.0
                unplanned_breakdown = np.random.exponential(18.0) if age_years > 4.5 else np.random.exponential(8.0)
                planned_pm_hours = np.random.uniform(20.0, 35.0)
                downtime_total = round(float(unplanned_breakdown + planned_pm_hours), 1)
                
                operating_hours = round(float(calendar_hours - downtime_total - np.random.uniform(40, 90)), 1)
                availability_pct = round((calendar_hours - downtime_total) / calendar_hours * 100.0, 1)
                utilization_pct = round(operating_hours / (calendar_hours - downtime_total) * 100.0, 1)
                
                # Reliability MTBF and MTTR
                failure_count = max(1, int(unplanned_breakdown / 6.0))
                mtbf_hours = round(operating_hours / failure_count, 1)
                mttr_hours = round(unplanned_breakdown / failure_count, 1)
                
                # Health score (0-100)
                health_score = int(np.clip(100 - (age_years * 4.2) - (unplanned_breakdown * 1.1) + np.random.normal(0, 3), 35, 98))
                
                # Production impact (tonnes ore handled)
                production_contribution_tonnes = int(operating_hours * capacity_tph * np.random.uniform(0.65, 0.85))
                
                status = "Healthy" if health_score >= 80 else ("Warning / Inspection Due" if health_score >= 60 else "High Breakdown Risk")
                
                records.append({
                    "equipment_id": eq_id,
                    "mine_id": mine_id,
                    "mine_name": mine["name"],
                    "equipment_type": prefix,
                    "equipment_model": model,
                    "age_years": round(age_years, 1),
                    "total_lifetime_hours": lifetime_hours,
                    "monthly_operating_hours": operating_hours,
                    "monthly_downtime_hours": downtime_total,
                    "breakdown_hours": round(unplanned_breakdown, 1),
                    "scheduled_pm_hours": round(planned_pm_hours, 1),
                    "availability_pct": availability_pct,
                    "utilization_pct": utilization_pct,
                    "mtbf_hours": mtbf_hours,
                    "mttr_hours": mttr_hours,
                    "health_score": health_score,
                    "status": status,
                    "hourly_capacity_tph": capacity_tph,
                    "monthly_production_tonnes": production_contribution_tonnes,
                    "fuel_efficiency_lph": round(float(capacity_tph * 0.12 + np.random.normal(0, 1.5)), 1),
                    "last_service_days_ago": int(np.random.uniform(3, 45)),
                    "is_synthetic": True
                })
                
    return pd.DataFrame(records)


def _generate_satellite_features_dataset() -> pd.DataFrame:
    """Generates Sentinel-2 multi-spectral reflectance pixels across mine bounding boxes."""
    records = []
    
    for mine in MINES:
        mine_id = mine["mine_id"]
        c_lat, c_lon = mine["center_lat"], mine["center_lon"]
        
        # 25x25 grid covering 2.5km x 2.5km area (100m pixel spacing)
        xs = np.linspace(-1200, 1200, 25)
        ys = np.linspace(-1200, 1200, 25)
        
        for x in xs:
            for y in ys:
                lat = c_lat + (y / 111320.0)
                lon = c_lon + (x / 103000.0)
                
                strike_dist = abs(x * np.sin(np.radians(60)) - y * np.cos(np.radians(60)))
                gondite_proximity = np.exp(-strike_dist / 400.0)
                
                # Synthetic Sentinel-2 bands (Surface Reflectance scale 0.0 - 1.0)
                # B2: Blue (490nm), B3: Green (560nm), B4: Red (665nm), B8: NIR (842nm), B11: SWIR1 (1610nm), B12: SWIR2 (2190nm)
                is_pit_or_gondite = gondite_proximity > 0.45
                is_vegetation = (not is_pit_or_gondite) and (np.random.rand() > 0.4)
                
                if is_pit_or_gondite:
                    # Manganese oxide / Gossan signature: strong blue-green absorption, high red/SWIR ratio
                    b2 = np.random.uniform(0.04, 0.08)  # Strong absorption
                    b3 = np.random.uniform(0.06, 0.11)
                    b4 = np.random.uniform(0.12, 0.22)  # High Red
                    b8 = np.random.uniform(0.14, 0.24)  # Moderate NIR
                    b11 = np.random.uniform(0.24, 0.38) # High SWIR1
                    b12 = np.random.uniform(0.18, 0.29)
                    zone_label = "Manganese Gossan / Alteration Outcrop"
                elif is_vegetation:
                    b2 = np.random.uniform(0.02, 0.05)
                    b3 = np.random.uniform(0.05, 0.12)
                    b4 = np.random.uniform(0.03, 0.07)
                    b8 = np.random.uniform(0.45, 0.72)  # High NIR
                    b11 = np.random.uniform(0.12, 0.22)
                    b12 = np.random.uniform(0.05, 0.12)
                    zone_label = "Dense / Moderate Canopy"
                else:
                    # Barren soil / Country rock
                    b2 = np.random.uniform(0.08, 0.14)
                    b3 = np.random.uniform(0.12, 0.18)
                    b4 = np.random.uniform(0.16, 0.24)
                    b8 = np.random.uniform(0.22, 0.32)
                    b11 = np.random.uniform(0.28, 0.42)
                    b12 = np.random.uniform(0.22, 0.34)
                    zone_label = "Barren Soil & Country Rock"
                    
                # Spectral Indices Calculations
                ndvi = (b8 - b4) / max(1e-5, (b8 + b4))
                ndwi = (b3 - b8) / max(1e-5, (b3 + b8))
                ndbi = (b11 - b8) / max(1e-5, (b11 + b8))
                iron_oxide_idx = b4 / max(1e-5, b2)
                clay_idx = b11 / max(1e-5, b12)
                ferrous_idx = (b11 / max(1e-5, b8)) + (b3 / max(1e-5, b4))
                
                # Multi-criteria Exploration Potential (0-100)
                spectral_score = (
                    (iron_oxide_idx / 3.5) * 40.0 +
                    (clay_idx / 2.0) * 30.0 +
                    ((1.0 - max(0, ndvi)) * 30.0)
                )
                exploration_potential_score = round(float(np.clip(spectral_score + (gondite_proximity * 25.0), 5.0, 98.0)), 1)
                
                if exploration_potential_score >= 75.0:
                    potential_class = "High Potential Exploration Zone"
                elif exploration_potential_score >= 45.0:
                    potential_class = "Medium Potential Zone"
                else:
                    potential_class = "Low Potential / Barren"
                    
                records.append({
                    "mine_id": mine_id,
                    "grid_x": round(x, 1),
                    "grid_y": round(y, 1),
                    "latitude": round(lat, 6),
                    "longitude": round(lon, 6),
                    "B02_Blue": round(float(b2), 4),
                    "B03_Green": round(float(b3), 4),
                    "B04_Red": round(float(b4), 4),
                    "B08_NIR": round(float(b8), 4),
                    "B11_SWIR1": round(float(b11), 4),
                    "B12_SWIR2": round(float(b12), 4),
                    "NDVI": round(float(ndvi), 4),
                    "NDWI": round(float(ndwi), 4),
                    "NDBI": round(float(ndbi), 4),
                    "iron_oxide_index": round(float(iron_oxide_idx), 3),
                    "clay_mineral_index": round(float(clay_idx), 3),
                    "ferrous_index": round(float(ferrous_idx), 3),
                    "exploration_potential_score": exploration_potential_score,
                    "potential_class": potential_class,
                    "spectral_zone_type": zone_label,
                    "is_synthetic": True
                })
                
    return pd.DataFrame(records)


if __name__ == "__main__":
    generated = generate_all_datasets()
    print("Successfully generated all synthetic MOIL mining datasets:")
    for k, v in generated.items():
        print(f" - {k}: {v}")
