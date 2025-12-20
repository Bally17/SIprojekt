import React from "react";
import getIconByName from "./getIconByName";
import IconName from "./iconName";
import { ClassNameParamType } from "@shared-types/ui/icons";

type IconProps = {
  name: IconName;
  className?: ClassNameParamType;
  size?: number;
} & React.SVGProps<SVGSVGElement>;

export const Icon = ({ name, className, size, ...rest }: IconProps) => {
  const IconCmp = getIconByName(name);

  if (IconCmp != null) {
    return <IconCmp className={className} size={size} {...rest} />;
  }
  return null;
};

export default Icon;
