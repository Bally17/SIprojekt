import React, { FC } from "react";
import IconName from "./iconName";
import getIconByName from "./getIconByName";
import ClassNameParamType from "../types/icons/ClassNameParamType";

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
