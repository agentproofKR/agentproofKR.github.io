"use client";

import { useEffect, useRef } from "react";

import { type ProblemOption, type RoleOption } from "@/components/landing/content";
import styles from "@/styles/landing.module.css";

import { type LeadPlacement, LeadForm } from "./LeadForm";

type LeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  placement: LeadPlacement;
  initialRole?: RoleOption;
  initialProblem?: ProblemOption;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LeadModal({ isOpen, onClose, placement, initialRole, initialProblem }: LeadModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle("modal-open", isOpen);
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const firstField = dialogRef.current?.querySelector<HTMLSelectElement>(
      initialRole ? "#stage" : "#role",
    );
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
  }, [initialRole, isOpen, onClose]);

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
            <h2 id="lead-modal-title">3분 AI 도입 과제 진단</h2>
            <p>가장 가까운 문제와 원하는 다음 단계를 알려주세요.</p>
          </div>
          <button className={styles.modalClose} type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <LeadForm
          key={`${placement}-${initialRole ?? "none"}-${initialProblem ?? "none"}`}
          placement={placement}
          initialRole={initialRole}
          initialProblem={initialProblem}
        />
      </div>
    </div>
  );
}
