import React, { createContext, useContext, useState, useEffect } from "react";
import { DataAPI } from "../services/api";

const MineContext = createContext();

export const MineProvider = ({ children }) => {
  const [mines, setMines] = useState([]);
  const [activeMine, setActiveMine] = useState(null);
  const [isSynthetic, setIsSynthetic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchMines = async () => {
    try {
      setLoading(true);
      const res = await DataAPI.getMines();
      setMines(res.data.mines || []);
      setIsSynthetic(res.data.is_synthetic);
      const active = (res.data.mines || []).find(m => m.mine_id === res.data.active_mine_id) || res.data.mines[0];
      setActiveMine(active);
    } catch (err) {
      console.error("Error fetching mines:", err);
      showToast("Could not connect to MOIL backend server. Using local fallback.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMines();
  }, []);

  const switchMine = async (mineId) => {
    try {
      setLoading(true);
      const res = await DataAPI.switchActiveMine(mineId);
      if (res.data.status === "SUCCESS") {
        setActiveMine(res.data.active_mine);
        showToast(`Switched active mine to ${res.data.active_mine.name}`, "info");
      }
    } catch (err) {
      console.error("Error switching mine:", err);
      showToast("Failed to switch mine. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const resetDemoData = async () => {
    try {
      setLoading(true);
      const res = await DataAPI.resetDemoData();
      if (res.data.status === "SUCCESS") {
        setIsSynthetic(true);
        await fetchMines();
        showToast("Datasets successfully reset to clean MOIL Demo/Synthetic baseline.", "live");
      }
    } catch (err) {
      console.error("Error resetting demo data:", err);
      showToast("Failed to reset demo data.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MineContext.Provider
      value={{
        mines,
        activeMine,
        isSynthetic,
        loading,
        toast,
        showToast,
        switchMine,
        resetDemoData,
        refreshData: fetchMines,
      }}
    >
      {children}
    </MineContext.Provider>
  );
};

export const useMine = () => useContext(MineContext);
