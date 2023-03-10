import { useCallback, useMemo, useState } from "react";
import { getInputIdByName } from "../utils";
import { UseInputBoxProps } from "./types";
import { DEFAULT_VALIDATION_DEBOUNCER_TIMER_IN_MILISSECONDS } from "../consts";
import { useValidate } from "./use-validate";
import { useDebounce } from "../../../../globals/utility-hooks";

export const useInput = <ValType, ControllerType>(
  props: UseInputBoxProps<ValType, ControllerType>
) => {
  // #region props
  const { inputProps, options } = props;
  const {
    name,
    label = "",
    id,
    onChange,
    onFocusIn,
    onFocusOut,
    readOnly = false,
    disabled = false,
    ignoreErrorMargin = false,
    validationRules,
    defaultValue,
    controller,
  } = inputProps;
  const { startValue, controllerValueModifier } = options;
  // #endregion

  const inputId = id ?? getInputIdByName(name as string);

  const { initialControllerValue, handleControllerChange } = useMemo(() => {
    if (controller) {
      const value = controller.addField(name as keyof ControllerType)
        .value as ValType;
      const processedValue = controllerValueModifier?.(value) ?? value;

      return {
        initialControllerValue: processedValue,
        handleControllerChange: controller.handleChange,
      };
    }
    return {
      value: null,
    };
  }, [controller, controllerValueModifier, name]);

  // #region hooks
  const [value, setValue] = useState<ValType>(
    startValue ?? (initialControllerValue as ValType)
  );

  const [error, setError] = useState("");

  const { validate } = useValidate();

  useDebounce(
    async () => {
      const validationError = await handleValidate();
      setError(validationError ?? "");
    },
    validationRules?.debounceTimer ??
      DEFAULT_VALIDATION_DEBOUNCER_TIMER_IN_MILISSECONDS,
    [value]
  );
  // #endregion

  // #region handlers
  const handleError = useCallback((newError: string) => {
    setError(newError);
  }, []);

  const handleFocusIn = useCallback(() => {
    onFocusIn?.(value);
  }, [value, onFocusIn]);
  const handleFocusOut = useCallback(() => {
    onFocusOut?.(value);
  }, [value, onFocusOut]);

  const handleChange = useCallback(
    (newValue: ValType) => {
      onChange?.(newValue, value);
      handleControllerChange?.(
        name as keyof ControllerType,
        newValue as ControllerType[keyof ControllerType]
      );
      setValue(newValue);
    },
    [onChange, value, handleControllerChange, name]
  );

  const handleValidate = useCallback(
    async () =>
      await validate<ValType>(value, label, validationRules, defaultValue),
    [validate, value, label, validationRules, defaultValue]
  );
  // #endregion

  const styledProps = useMemo(
    () => ({
      hasError: !!error,
      required: !!validationRules?.required,
      readOnly,
      disabled,
      ignoreErrorMargin,
    }),
    [error, validationRules?.required, readOnly, disabled, ignoreErrorMargin]
  );

  const Label = useMemo(
    () =>
      label ? (
        <label htmlFor={inputId}>
          {(validationRules?.required ? "*" : "").concat(label)}
        </label>
      ) : null,
    [inputId, validationRules?.required, label]
  );

  return {
    inputId,

    value,
    error,
    Label,

    handleError,
    handleFocusIn,
    handleFocusOut,
    handleChange,
    handleValidate,

    styledProps,
  };
};
