"use client";
import { setUserData } from "@/redux/userSlice";
import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

function UseGetMe(enabled: boolean) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) return;
    const fetchData = async () => {
      try{
        const { data } = await axios.get("/api/user/me");
        dispatch(setUserData(data));
      }catch(error){
        console.log("error",error)
      }
    };
    fetchData();
  }, [enabled]);
}


export default UseGetMe;
