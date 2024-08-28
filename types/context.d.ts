interface Toast {
  type: "error" | "success";
  message: string;
}

type AppContext = [
  {
    refetchHistoryItems: () => void;
  },
  {
    toast: Accessor<Toast | null>;
    setToast: Setter<Toast | null>;
  }
];
