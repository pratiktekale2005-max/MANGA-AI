"""
Model 11: What-If Scenario Simulation Engine
Simulates multi-scenario mining operational trade-offs across equipment fleet shifts,
weather/monsoon delays, cutoff grade modifications, and production target adjustments.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List


class ScenarioSimulator:
    """Simulates comparative operational scenarios and sensitivity metrics."""

    @classmethod
    def simulate_scenarios(
        cls,
        base_target_tonnes: float = 35000.0,
        base_grade: float = 40.5,
        base_fleet_avail: float = 84.0,
        base_working_days: int = 26,
        base_recovery_pct: float = 88.0,
        custom_params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Runs 4 standard comparative scenarios (A, B, C, D) plus an optional custom user scenario.
        """
        def _calc_scenario(name: str, target_t: float, grade: float, avail: float, days: int, rec_pct: float, desc: str):
            # Production capability scaling
            avail_factor = avail / 84.0
            days_factor = days / 26.0
            prod_cap = target_t * avail_factor * days_factor * np.random.uniform(0.97, 1.01)
            
            actual_prod = round(min(prod_cap, target_t * 1.12), 0)
            shortfall = round(target_t - actual_prod, 0)
            shortfall_pct = round((shortfall / target_t) * 100.0, 1)
            
            contained_mn = round(actual_prod * (grade / 100.0) * (rec_pct / 100.0), 1)
            revenue_cr_inr = round((contained_mn * 28500.0) / 1e7, 2)  # Crores INR

            risk_level = "Low" if shortfall_pct <= 3.0 else ("Moderate" if shortfall_pct <= 10.0 else "Critical")

            return {
                "scenario_name": name,
                "description": desc,
                "target_ore_tonnes": round(target_t, 0),
                "expected_production_tonnes": actual_prod,
                "ore_grade_pct": round(grade, 2),
                "fleet_availability_pct": round(avail, 1),
                "working_days": days,
                "recovery_pct": round(rec_pct, 1),
                "contained_mn_tonnes": contained_mn,
                "shortfall_tonnes": shortfall,
                "shortfall_pct": shortfall_pct,
                "revenue_crores_inr": revenue_cr_inr,
                "risk_level": risk_level
            }

        # Scenario A: Baseline
        scen_a = _calc_scenario(
            "Scenario A: Current Baseline Plan",
            base_target_tonnes, base_grade, base_fleet_avail, base_working_days, base_recovery_pct,
            "Standard planned operating conditions and equipment readiness."
        )

        # Scenario B: High Fleet Availability (+12%)
        scen_b = _calc_scenario(
            "Scenario B: High Fleet Availability (+12%)",
            base_target_tonnes, base_grade, min(98.0, base_fleet_avail + 12.0), base_working_days, base_recovery_pct,
            "Optimized preventive maintenance and 96% fleet availability."
        )

        # Scenario C: Monsoon Weather Downtime (-20%)
        scen_c = _calc_scenario(
            "Scenario C: Severe Monsoon Season",
            base_target_tonnes, base_grade * 0.96, base_fleet_avail - 16.0, 20, base_recovery_pct - 3.5,
            "Monsoon rainfall leading to pit water pumping, wet ore processing, and 20 working days."
        )

        # Scenario D: High Cut-Off Grade Strategy (Selective Mining)
        scen_d = _calc_scenario(
            "Scenario D: High-Grade Selective Extraction",
            base_target_tonnes * 0.85, base_grade * 1.12, base_fleet_avail, base_working_days, base_recovery_pct + 2.0,
            "Selective extraction focusing purely on high-grade Braunite beds (>42% Mn)."
        )

        scenarios = [scen_a, scen_b, scen_c, scen_d]

        # Scenario Custom if provided
        if custom_params:
            c_target = float(custom_params.get("target_tonnes", base_target_tonnes))
            c_grade = float(custom_params.get("ore_grade_pct", base_grade))
            c_avail = float(custom_params.get("fleet_availability_pct", base_fleet_avail))
            c_days = int(custom_params.get("working_days", base_working_days))
            c_rec = float(custom_params.get("recovery_pct", base_recovery_pct))
            
            scen_custom = _calc_scenario(
                "Scenario Custom: User Defined",
                c_target, c_grade, c_avail, c_days, c_rec,
                "Interactive user parameter simulation."
            )
            scenarios.append(scen_custom)

        return {
            "baseline_target_tonnes": base_target_tonnes,
            "scenarios": scenarios,
            "comparison_summary": {
                "max_production_scenario": max(scenarios, key=lambda s: s["expected_production_tonnes"])["scenario_name"],
                "highest_revenue_scenario": max(scenarios, key=lambda s: s["revenue_crores_inr"])["scenario_name"],
                "lowest_risk_scenario": min(scenarios, key=lambda s: s["shortfall_pct"])["scenario_name"]
            }
        }
