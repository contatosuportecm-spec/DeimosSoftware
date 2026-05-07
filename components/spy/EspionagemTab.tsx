"use client";

import AdsLibraryModule from "./spionage/AdsLibraryModule";
import UrlscanModule from "./spionage/UrlscanModule";
import ReclameAquiModule from "./spionage/ReclameAquiModule";

export default function EspionagemTab() {
  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AdsLibraryModule />
        <UrlscanModule />
        <ReclameAquiModule />
      </div>
    </div>
  );
}
