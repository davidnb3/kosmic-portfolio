import { Arrangement } from "./Arrangement";
import { Library } from "./Library";
import { Transport } from "./Transport";
import { useDawShortcuts } from "./useDawShortcuts";

export function MusicPage() {
  useDawShortcuts();

  return (
    <div className="h-dvh overflow-auto bg-[#e7e7e4] text-[#1c1c1c]">
      <div className="flex h-dvh min-w-[1080px] flex-col">
        <Transport />
        <div className="flex min-h-0 flex-1">
          <Library />
          <Arrangement />
        </div>
      </div>
    </div>
  );
}
