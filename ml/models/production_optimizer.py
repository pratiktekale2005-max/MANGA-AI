"""
Model 10: Production Planning & Mine Extraction Optimization Engine
Applies constrained optimization (Linear/Heuristic Knapsack with Blend Grade Constraints)
to schedule mine block extraction maximizing contained Mn while satisfying equipment capacity.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from scipy.optimize import linprog


class ProductionOptimizer:
    """Solves multi-constraint mining extraction scheduling for optimal grade blending."""

    @classmethod
    def optimize_plan(
        cls,
        df_blocks: pd.DataFrame,
        target_production_tonnes: float = 35000.0,
        equipment_capacity_tonnes: float = 45000.0,
        min_blend_grade_pct: float = 32.0,
        planning_period_months: int = 1
    ) -> Dict[str, Any]:
        """
        Generates an optimal block extraction schedule.
        """
        df = df_blocks.copy()
        grade_col = "predicted_mn_grade" if "predicted_mn_grade" in df.columns else "grade"
        df["grade"] = df[grade_col].astype(float)
        
        if "total_tonnage" not in df.columns:
            df["total_tonnage"] = 150000.0 * 3.5

        # Effective tonnage available for short-term extraction per block (e.g. 10% slice per period)
        df["avail_period_tonnage"] = df["total_tonnage"] * 0.12
        df["contained_mn_period"] = df["avail_period_tonnage"] * (df["grade"] / 100.0)

        # Economic score per block (Value of Mn contained minus extraction & haulage cost)
        # Assuming Mn ore value ~ INR 7,500 / tonne for 40% grade (pro-rated by grade)
        df["revenue_per_t"] = df["grade"] * 220.0
        cost_per_t = df.get("est_extraction_cost_inr", pd.Series(550.0, index=df.index))
        df["profit_per_t"] = df["revenue_per_t"] - cost_per_t

        # Sort blocks by profit density (profit per tonne) prioritizing higher grade & accessible benches
        bench_factor = df.get("depth_below_surface", pd.Series(30.0, index=df.index)) / 100.0
        df["efficiency_rank"] = (df["grade"] * 2.5) - (bench_factor * 15.0) + (df.get("confidence_score", pd.Series(0.8, index=df.index)) * 20.0)

        sorted_blocks = df.sort_values(by="efficiency_rank", ascending=False)

        selected_blocks = []
        cum_tonnage = 0.0
        cum_mn = 0.0
        max_cap = min(target_production_tonnes * 1.15, equipment_capacity_tonnes)

        for idx, row in sorted_blocks.iterrows():
            if cum_tonnage >= target_production_tonnes or cum_tonnage >= max_cap:
                break

            b_t = float(row["avail_period_tonnage"])
            b_grade = float(row["grade"])

            # Pro-rate last block if needed to match exact capacity
            if cum_tonnage + b_t > max_cap:
                b_t = max_cap - cum_tonnage

            if b_t < 100.0:
                continue

            b_mn = b_t * (b_grade / 100.0)
            cum_tonnage += b_t
            cum_mn += b_mn

            selected_blocks.append({
                "sequence_step": len(selected_blocks) + 1,
                "block_id": str(row["block_id"]),
                "scheduled_tonnage": round(b_t, 0),
                "mn_grade_pct": round(b_grade, 2),
                "contained_mn_tonnes": round(b_mn, 1),
                "z_elevation": float(row.get("z_elevation", 300.0)),
                "depth_m": float(row.get("depth_below_surface", 25.0)),
                "geological_category": str(row.get("geological_category", "Ore Body")),
                "extraction_priority": "High Priority" if len(selected_blocks) < 5 else "Secondary"
            })

        # Calculate final blended metrics
        total_sched_t = float(cum_tonnage)
        total_sched_mn = float(cum_mn)
        blended_grade = round((total_sched_mn / max(1.0, total_sched_t)) * 100.0, 2)
        target_satisfaction_pct = round((total_sched_t / target_production_tonnes) * 100.0, 1)

        # Blend Grade feasibility check
        meets_grade_constraint = blended_grade >= min_blend_grade_pct
        status = "Optimal Schedule Generated" if (target_satisfaction_pct >= 95.0 and meets_grade_constraint) else "Constraint Warning: Sub-target or Low Grade"

        return {
            "status": status,
            "planning_period_months": planning_period_months,
            "target_production_tonnes": target_production_tonnes,
            "equipment_handling_limit_tonnes": equipment_capacity_tonnes,
            "scheduled_production_tonnes": round(total_sched_t, 0),
            "target_fulfillment_pct": target_satisfaction_pct,
            "scheduled_contained_mn_tonnes": round(total_sched_mn, 1),
            "blended_mn_grade_pct": blended_grade,
            "min_required_grade_pct": min_blend_grade_pct,
            "meets_grade_constraint": meets_grade_constraint,
            "blocks_scheduled_count": len(selected_blocks),
            "scheduled_blocks": selected_blocks
        }
