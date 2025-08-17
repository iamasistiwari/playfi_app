import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import { Portal, Dialog, Button } from "react-native-paper";
import { cn } from "@/lib/utils";
import { CustomButton } from "./CustomButton";

interface WithTrigger {
  triggerTitle: string;
  triggerClassName?: string;
  triggerVariant?: "default" | "destructive" | "outline" | "ghost" | "link";
  dialogTitle: string;
  dialogContent: React.ReactNode;
  visible?: never;
  handleClose?: never;
  onSubmit?: () => Promise<void>;
  actionTitle?: string;
  autoClose?: boolean;
}

interface Controlled {
  triggerTitle?: undefined;
  triggerClassName?: undefined;
  triggerVariant?: undefined;
  dialogTitle: string;
  dialogContent: React.ReactNode;
  visible: boolean;
  handleClose: () => void;
  onSubmit?: () => Promise<void>;
  actionTitle?: string;
  autoClose?: boolean;
}

type Props = WithTrigger | Controlled;

const CustomPortal = ({
  triggerTitle,
  triggerClassName,
  triggerVariant = "ghost",
  dialogTitle,
  dialogContent,
  visible,
  handleClose,
  onSubmit,
  actionTitle = "Ok",
  autoClose = true,
}: Props) => {
  const [portalVisible, setPortalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePortalClose = () => {
    if (triggerTitle) {
      setPortalVisible(false);
    } else if (handleClose) {
      handleClose();
    }
  };

  return (
    <View>
      {triggerTitle && (
        <CustomButton
          variant={triggerVariant}
          onPress={() => setPortalVisible(true)}
          className={cn("p-0 mt-4 justify-start", triggerClassName)}
          title={triggerTitle}
        />
      )}
      <Portal>
        <Dialog
          visible={triggerTitle ? portalVisible : visible}
          onDismiss={handlePortalClose}
        >
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Content>{dialogContent}</Dialog.Content>
          <Dialog.Actions>
            <CustomButton
              loading={loading}
              onPress={async () => {
                setLoading(true);
                await onSubmit?.();
                setLoading(false);
                if (autoClose) {
                  handlePortalClose();
                }
              }}
              title={actionTitle}
              className="p-0"
              variant={"link"}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default CustomPortal;
