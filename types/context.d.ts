type Accessor<T> = import("solid-js").Accessor<T>;
type Resource<T> = import("solid-js").Resource<T>;
type Setter<T> = import("solid-js").Setter<T>;

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
  },
  {
    config: Resource<Config>;
    refetchConfig: () => void;
  },
];
