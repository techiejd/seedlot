"use client";
import React, { useState } from 'react';

interface Location {
  lat: number;
  long: number;
  lotsPerOrder: number;
  treeTypes: string[];
  description: string;
  image: string;
}

const lotLimits: { [key in 'toraja' | 'kintamani' | 'sarawak']: Array<Location> } = {
  toraja: [
    {
      lat: -3.0457,
      long: 119.8222,
      lotsPerOrder: 1000,
      treeTypes: ['SL795', 'Typica', 'Catuai'],
      description: 'Toraja, Sulawesi, Indonesia [1800m arabica]',
      image: 'toraja.jpg'
    }
  ],
  kintamani: [
    {
      lat: -8.3256,
      long: 115.3126,
      lotsPerOrder: 100,
      treeTypes: ['Catuai'],
      description: 'Kintamani, Bali, Indonesia [1200m arabica]',
      image: 'kintamani.jpg'
    }
  ],
  sarawak: [
    {
      lat: 1.5533,
      long: 110.3592,
      lotsPerOrder: 500,
      treeTypes: ['Liberica'],
      description: 'Sarawak, Malaysia [1000m liberica]',
      image: 'sarawak.jpg'
    }
  ],
};

export default function ClientPage() {
  const [selectedFarm, setSelectedFarm] = useState<'toraja' | 'kintamani' | 'sarawak'>('toraja');
  const [maxLots, setMaxLots] = useState(lotLimits[selectedFarm][0].lotsPerOrder);
  const [selectedTreeType, setSelectedTreeType] = useState<'toraja' | 'kintamani' | 'sarawak'>('toraja');

  const handleFarmChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFarm = event.target.value as 'toraja' | 'kintamani' | 'sarawak';
    setSelectedFarm(newFarm);
    setMaxLots(lotLimits[newFarm][0].lotsPerOrder);
  };

  const handleTreeTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTreeType(event.target.value as 'toraja' | 'kintamani' | 'sarawak');
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">1 Lot == 100 Trees</h1>
      </div>
      <div className="flex flex-col items-center justify-center">
        <label className="mt-4">
          Which farm would you like to purchase lots from: 
          <select className="ml-2 p-2 border rounded" value={selectedFarm} onChange={handleFarmChange}>
            <option value="toraja">
              Toraja, Sulawesi, Indonesia [1800m arabica]
            </option>
            <option value="kintamani">
              Kintamani, Bali, Indonesia [1200m arabica]
            </option>
            <option value="sarawak">Sarawak, Malaysia [1000m liberica]</option>
          </select>
        </label>
        <p id="maxLots">You can purchase up to {maxLots} lots at one time from this manager</p>

        {selectedFarm && (
          <label className="mt-4">
            Which tree type would you like to purchase: 
            <select className="ml-2 p-2 border rounded" value={selectedTreeType} onChange={handleTreeTypeChange}>
              {lotLimits[selectedFarm][0].treeTypes.map((treeType) => (
          <option key={treeType} value={treeType}>
            {treeType}
          </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}