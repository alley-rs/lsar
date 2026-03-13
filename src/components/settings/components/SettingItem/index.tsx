import { mergeProps, type JSX } from "solid-js";

import type { FieldProps } from "fluent-solid";

import { LazyField } from "~/lazy";

interface SettingItemProps {
  label: string;
  children: JSX.Element;
  orientation?: FieldProps["orientation"];
  tips?: string;
}

const SettingItem = (props: SettingItemProps) => {
  const merged = mergeProps(
    { orientation: "horizontal" as FieldProps["orientation"] },
    props,
  );

  return (
    <LazyField
      orientation={merged.orientation}
      // label={{ children: props.label, class: styles.label }}
      label={props.label}
      validationMessage={merged.tips}
    >
      {props.children}
    </LazyField>
  );
};

export default SettingItem;
