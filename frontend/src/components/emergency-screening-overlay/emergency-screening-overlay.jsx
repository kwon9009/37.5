import { useEffect, useRef, useState } from "react";
import Icon from "../icon/icon.jsx";
import { parseSpecialNotes } from "../../lib/special-notes.js";

function useAlertSound(active) {
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return undefined;

    const audioCtx = new AudioContextClass();
    audioCtxRef.current = audioCtx;

    const beep = () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    };

    beep();
    const interval = setInterval(beep, 900);

    // 브라우저 자동재생 정책 때문에 첫 소리가 막혔을 경우, 사용자의 첫 클릭에 재개 시도
    const resumeOnInteraction = () => {
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    };
    document.addEventListener("click", resumeOnInteraction, { once: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", resumeOnInteraction);
      audioCtx.close().catch(() => {});
    };
  }, [active]);
}

function useLiveJitter(baseValue, active, spread = 2) {
  const [value, setValue] = useState(baseValue);

  useEffect(() => {
    if (!active) return undefined;
    setValue(baseValue);
    const interval = setInterval(() => {
      setValue(baseValue + Math.round((Math.random() - 0.5) * spread * 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [active, baseValue, spread]);

  return value;
}

function EmergencyScreeningOverlay({ patient, onAcknowledge, onRespond }) {
  const isOpen = Boolean(patient);
  useAlertSound(isOpen);
  const liveHeartRate = useLiveJitter(patient?.heartRate ?? 0, isOpen, 2);
  const liveRespirationRate = useLiveJitter(patient?.respirationRate ?? 0, isOpen, 1);

  if (!isOpen) return null;

  const criticalNotes = parseSpecialNotes(patient.specialNotes).filter((tag) => tag.critical);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergencyScreeningTitle"
      className="emergency-screening-overlay fixed inset-0 z-[200] flex items-center justify-center p-6"
    >
      <div className="flex w-[440px] max-w-full flex-col items-center gap-6 rounded-2xl border-4 border-white bg-white/95 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <span className="emergency-screening-overlay__icon flex h-20 w-20 items-center justify-center rounded-full bg-[#FDEDEA]">
          <Icon name="shield-alert" size={40} className="text-[#E0442E]" />
        </span>

        <div className="flex flex-col gap-1">
          <p id="emergencyScreeningTitle" className="text-xl font-extrabold text-[#E0442E]">
            응급 상황 발생
          </p>
          <p className="text-lg font-bold text-[#1E2A3A]">{patient.name}</p>
          <p className="font-mono text-sm text-[#5A6B80]">{patient.room}</p>
        </div>

        <div className="flex w-full gap-3">
          <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-[#FDEDEA] py-4">
            <span className="flex items-center gap-1 text-xs font-bold tracking-wide text-[#E0442E]">
              <Icon name="heart-pulse" size={14} className="text-[#E0442E]" />
              심박
            </span>
            <span className="font-mono text-3xl font-extrabold text-[#1E2A3A]">{liveHeartRate}</span>
            <span className="text-xs text-[#5A6B80]">bpm</span>
          </div>
          <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-[#FDEDEA] py-4">
            <span className="flex items-center gap-1 text-xs font-bold tracking-wide text-[#E0442E]">
              <Icon name="wind" size={14} className="text-[#E0442E]" />
              호흡
            </span>
            <span className="font-mono text-3xl font-extrabold text-[#1E2A3A]">{liveRespirationRate}</span>
            <span className="text-xs text-[#5A6B80]">회/분</span>
          </div>
        </div>

        {criticalNotes.length > 0 && (
          <div className="flex w-full flex-col gap-[6px] rounded-xl border border-[#F5C6BE] bg-[#FDEDEA] p-3 text-left">
            <span className="flex items-center gap-1 text-[11px] font-bold tracking-wide text-[#E0442E]">
              <Icon name="circle-alert" size={13} className="text-[#E0442E]" />
              대응 전 확인
            </span>
            {criticalNotes.map((note, index) => (
              <div key={`${note.label}-${index}`} className="flex items-center gap-2">
                <Icon name={note.icon} size={16} className="shrink-0 text-[#E0442E]" />
                <span className="text-[13px] font-bold text-[#E0442E]">{note.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex w-full flex-col gap-[10px]">
          <button
            type="button"
            onClick={onRespond}
            className="flex h-[50px] items-center justify-center gap-2 rounded-lg bg-[#E0442E] text-[15px] font-bold text-white"
          >
            <Icon name="phone-outgoing" size={18} className="text-white" />
            대응 시작
          </button>
          <button
            type="button"
            onClick={onAcknowledge}
            className="flex h-[46px] items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white text-sm font-bold text-[#5A6B80]"
          >
            <Icon name="check" size={16} className="text-[#5A6B80]" />
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmergencyScreeningOverlay;
