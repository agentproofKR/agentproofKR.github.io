"use client";

import { useEffect, useRef } from "react";

import styles from "@/styles/landing.module.css";

import { LeadForm } from "./LeadForm";

type LeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  placement: "header" | "hero" | "process";
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LeadModal({ isOpen, onClose, placement }: LeadModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle("modal-open", isOpen);
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const firstField = dialogRef.current?.querySelector<HTMLSelectElement>("#role");
    firstField?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`${styles.modalOverlay} ${isOpen ? styles.modalOpen : ""}`}
      aria-hidden={!isOpen}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 id="lead-modal-title">AI 준비도 진단 신청</h2>
            <p>현재 상황을 남겨주시면 샘플 리포트와 파일럿 안내를 보내드립니다.</p>
          </div>
          <button className={styles.modalClose} type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <LeadForm placement={placement} />
      </div>
    </div>
  );
}
