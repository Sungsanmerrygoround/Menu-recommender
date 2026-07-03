"use client";

import { useRef, useState } from "react";
import BottomSheet from "./BottomSheet";
import { useToast } from "./Toast";
import { exportAllData, importAllData, type BackupData } from "@/lib/queries";
import { todayString } from "@/lib/date-utils";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const showToast = useToast();

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    try {
      const backup = await exportAllData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-backup-${todayString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        `요리 ${backup.dishes.length}개, 기록 ${backup.meal_logs.length}개를 내보냈어요`
      );
    } catch {
      showToast("내보내기에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(file: File) {
    if (busy) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text()) as BackupData;
      if (
        parsed?.version !== 1 ||
        !Array.isArray(parsed.dishes) ||
        !Array.isArray(parsed.meal_logs)
      ) {
        showToast("백업 파일 형식이 아니에요");
        return;
      }
      await importAllData(parsed);
      showToast("복원했어요. 새로고침할게요");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      showToast("복원에 실패했어요. 파일을 확인해주세요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="설정 ⚙️">
      <p className="-mt-2 mb-5 text-[13px] leading-relaxed text-sub">
        이 앱은 링크를 아는 모든 기기가 같은 데이터를 공유해요. 실수로 지우는
        경우를 대비해 가끔 백업해두세요.
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className="grad-primary shadow-btn-grad press-effect h-[54px] w-full rounded-2xl text-[16px] font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? "처리 중..." : "데이터 백업하기 (JSON 저장)"}
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="press-effect mt-2.5 h-[52px] w-full rounded-2xl bg-field text-[14px] font-bold text-chip-ink disabled:opacity-40"
      >
        백업 파일에서 복원하기
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleImportFile(file);
        }}
      />
      <p className="mt-4 text-center text-[11px] font-semibold text-muted">
        복원은 id 기준 병합이라 기존 데이터 위에 안전하게 덮어써요
      </p>
    </BottomSheet>
  );
}
