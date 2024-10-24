import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  classNames,
  parsePhoneNumber,
  formatPhoneNumber as formatPhoneNumberUtil,
  getCountryCode,
  CountryData,
  // humanizeStrings,
} from "../../../Utils/utils";
import phoneCodesJson from "@/common/static/countryPhoneAndFlags.json";
import {
  FieldError,
  PhoneNumberValidator,
  PhoneNumberType,
} from "../FieldValidators";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
// import { useTranslation } from "react-i18next";
import React from "react";
const phoneCodes: Record<string, CountryData> = phoneCodesJson;

interface Props extends FormFieldBaseProps<string> {
  types: PhoneNumberType[];
  placeholder?: string;
  autoComplete?: string;
  disableValidation?: boolean;
}

const PhoneNumberFormField = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    const field = useFormFieldPropsResolver(props);
    const [error, setError] = useState<FieldError | undefined>();
    const [country, setCountry] = useState<CountryData>({
      flag: "🇮🇳",
      name: "India",
      code: "91",
    });
    const validator = useMemo(
      () => PhoneNumberValidator(props.types),
      [props.types],
    );

    const validate = useMemo(
      () => (value: string | undefined, event: "blur" | "change") => {
        if (!value || props.disableValidation) {
          return;
        }

        const newError = validator(value);

        if (!newError) {
          return;
        } else if (event === "blur") {
          return newError;
        }
      },
      [props.disableValidation],
    );

    const setValue = useCallback(
      (value: string) => {
        value = value.replaceAll(/[^0-9+]/g, "");
        if (value.length > 12 && value.startsWith("+910")) {
          value = "+91" + value.slice(4);
        }

        const error = validate(value, "change");
        field.handleChange(value);

        setError(error);
      },
      [field, validate],
    );

    const handleCountryChange = (value: CountryData): void => {
      setCountry(value);
      setValue(conditionPhoneCode(value.code));
    };

    useEffect(() => {
      if (field.value && field.value.length > 0) {
        if (field.value.startsWith("1800")) {
          setCountry({ flag: "📞", name: "Support", code: "1800" });
          return;
        }
        if (field.value === "+") {
          setCountry({ flag: "🌍", name: "Other", code: "+" });
          return;
        }
        setCountry(phoneCodes[getCountryCode(field.value)!]);
      }
    }, [setValue]);

    useEffect(() => {
      setValue(field.value || "+91");
    }, []);

    return (
      <FormField
        field={{
          ...field,
          errorClassName: "hidden",
          error: field.error || error,
          labelSuffix: field.labelSuffix || "",
        }}
      >
        <div className="relative rounded-md">
          <Popover>
            {({ open }: { open: boolean }) => {
              return (
                <>
                  <PopoverButton className="absolute h-full">
                    <div className="hover:border-1 absolute inset-y-0 left-0 flex cursor-pointer items-center justify-around border-gray-200 hover:border hover:bg-gray-50">
                      <span className="rounded-md pl-2">{country?.flag}</span>
                      <CareIcon
                        icon="l-angle-down"
                        className={`text-2xl font-bold ${open && "rotate-180"}`}
                      />
                    </div>
                  </PopoverButton>
                  <input
                    type="tel"
                    id={field.id}
                    name={field.name}
                    autoComplete={props.autoComplete ?? "tel"}
                    className={classNames(
                      "cui-input-base h-full pl-14 tracking-widest sm:leading-6",
                      field.error && "border-danger-500",
                      field.className,
                    )}
                    maxLength={field.value?.startsWith("1800") ? 11 : 15}
                    placeholder={props.placeholder}
                    value={formatPhoneNumber(field.value, props.types)}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={field.disabled}
                    onBlur={() => setError(validate(field.value, "blur"))}
                    ref={ref}
                  />
                  <PopoverPanel className="w-full">
                    {({ close }) => (
                      <CountryCodesList
                        handleCountryChange={handleCountryChange}
                        onClose={close}
                      />
                    )}
                  </PopoverPanel>
                </>
              );
            }}
          </Popover>
        </div>
      </FormField>
    );
  },
);

const conditionPhoneCode = (code: string) => {
  code = code.split(" ")[0];
  return code.startsWith("+") ? code : "+" + code;
};

const formatPhoneNumber = (
  value: string | undefined,
  types: PhoneNumberType[],
) => {
  if (!value) {
    return "+91 ";
  }

  if (PhoneNumberValidator(types)(value) !== undefined || value.length < 13) {
    return value;
  }

  const phoneNumber = parsePhoneNumber(value);
  return phoneNumber ? formatPhoneNumberUtil(phoneNumber) : value;
};

const CountryCodesList = ({
  handleCountryChange,
  onClose,
}: {
  handleCountryChange: (value: CountryData) => void;
  onClose: () => void;
}) => {
  const [searchValue, setSearchValue] = useState<string>("");

  return (
    <div className="absolute z-10 w-full rounded-md border border-gray-300 bg-white shadow-lg transition-all duration-300">
      <div className="relative m-2">
        <CareIcon
          icon="l-search"
          className="absolute left-3 top-3 mr-1 text-base"
        />
        <input
          type="search"
          placeholder="Search"
          className="w-full border-b border-secondary-400 p-2 pl-10 focus:outline-none focus:ring-0"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <ul className="max-h-[200px] overflow-x-hidden overflow-y-scroll px-2">
        {Object.entries(phoneCodes)
          .filter(([country, { flag, name, code }]) => {
            if (searchValue === "") {
              return true;
            }
            return (
              name.toLowerCase().includes(searchValue.toLowerCase()) ||
              code.includes(searchValue) ||
              country.toLowerCase().includes(searchValue.toLowerCase()) ||
              flag.includes(searchValue)
            );
          })
          .map(([country, { flag, name, code }]) => (
            <li
              key={country}
              className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-primary-100 hover:text-primary-600"
              onClick={() => {
                handleCountryChange({ flag, name, code });
                onClose();
              }}
            >
              <span>{flag}</span>
              <span>{name}</span>
              <span className="text-secondary-600">
                {" "}
                ({conditionPhoneCode(code)})
              </span>
            </li>
          ))}
        <li
          key={"support"}
          className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-primary-100 hover:text-primary-600"
          onClick={() => {
            handleCountryChange({ flag: "📞", name: "Support", code: "1800" });
            onClose();
          }}
        >
          <span>📞</span>
          <span>Support</span>
          <span className="text-secondary-600"> (1800)</span>
        </li>
        <li
          key={"other"}
          className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-primary-100 hover:text-primary-600"
          onClick={() => {
            handleCountryChange({ flag: "🌍", name: "Other", code: "+" });
            onClose();
          }}
        >
          <span>🌍</span>
          <span>Other</span>
          <span className="text-secondary-600"> (+)</span>
        </li>
      </ul>
    </div>
  );
};
export default PhoneNumberFormField;