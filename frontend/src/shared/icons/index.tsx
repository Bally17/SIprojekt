import ClassNameParamType from "@type/props/icons/ClassNameParamType";
import React, { FC } from "react";
import getIconByName from "./getIconByName";
import IconName from "./iconName";

interface IconProps {
  name: IconName;
  className?: ClassNameParamType;
  size?: number;
}

const Icon: FC<IconProps> = ({ name, className, size, ...rest }) => {
  const IconCmp = getIconByName(name);

  if (IconCmp != null) {
    return <IconCmp className={className} size={size} {...rest} />;
  }
  return null;
};

export default Icon;
