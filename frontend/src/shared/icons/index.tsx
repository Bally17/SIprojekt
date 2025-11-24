import ClassNameParamType from "@type/props/icons/ClassNameParamType";
import React from "react";
import getIconByName from "./getIconByName";
import IconName from "./iconName";

interface IconProps {
  name: IconName;
  className?: ClassNameParamType;
  size?: number;
}

export const Icon = ({ name, className, size, ...rest }: IconProps) => {
  const IconCmp = getIconByName(name);

  if (IconCmp != null) {
    return <IconCmp className={className} size={size} {...rest} />;
  }
  return null;
};

export default Icon;
