'use client'
import React, { useState } from 'react'
import HeroSection from './heroSection'
import VehicleSlider from './vehicleSlider'
import AuthModal from './authModal'

function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false)
  return (
    <>
      <HeroSection onAuthRequired={()=>setAuthOpen(true)}/>
      <VehicleSlider />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

export default PublicHome