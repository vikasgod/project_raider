"use client";
import React from "react";
import { motion } from "motion/react";
import Image from "next/image";

function DocsPreview({ label, url }: any) {
  const isImage = url?.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = url?.endsWith(".pdf");
  return (
    <div className="bg-gray-50 rounded-2xl border overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b text-sm font-semibold">{label}</div>
      <div className="h-52 flex items-center justify-center bg-white">
        {!url && (
          <span className="text-xs text-gray-400">Image not Uploaded</span>
        )}
        {isImage && (
          <Image
            width={100}
            height={100}
            src={url}
            className="w-full h-full object-cover"
            alt="image"
          />
        )}
        {isPdf && <iframe src={url} className="w-full h-full"/>}
      </div>
    </div>
  );
}

export default DocsPreview;
