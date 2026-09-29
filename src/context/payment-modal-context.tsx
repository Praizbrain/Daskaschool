import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { PaymentModal } from "@/components/fin/payment-modal";

type PaymentModalContextValue = {
  isOpen: boolean;
  studentId: string | null;
  openPaymentModal: (studentId?: string) => void;
  closePaymentModal: () => void;
};
const PaymentModalContext = createContext<PaymentModalContextValue | null>(null);
export function PaymentModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const value = useMemo<PaymentModalContextValue>(
    () => ({
      isOpen,
      studentId,
      openPaymentModal: (id?: string) => {
        setStudentId(id ?? null);
        setIsOpen(true);
      },
      closePaymentModal: () => setIsOpen(false),
    }),
    [isOpen, studentId],
  );
  return (
    <PaymentModalContext.Provider value={value}>
      {children}
      <PaymentModal isOpen={isOpen} studentId={studentId} onClose={value.closePaymentModal} />
    </PaymentModalContext.Provider>
  );
}
export function usePaymentModal(): PaymentModalContextValue {
  const context = useContext(PaymentModalContext);
  if (!context) throw new Error("usePaymentModal must be used within PaymentModalProvider.");
  return context;
}
