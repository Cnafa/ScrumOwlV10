import { installGlobalErrorHooks } from "../libs/logging/globalErrorHooks";
import { installUiActionTracker } from "../libs/logging/uiActionTracker";

export function bootstrapApp() {
  installGlobalErrorHooks();
  installUiActionTracker();
}
