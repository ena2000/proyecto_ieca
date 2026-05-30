import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  expandOutline,
  closeOutline,
  downloadOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
  funnelOutline,
  businessOutline,
  cashOutline,
  trendingDownOutline
} from 'ionicons/icons';

export function registerReportesPageIcons(): void {
  addIcons({
    'notifications-outline': notificationsOutline,
    'expand-outline': expandOutline,
    'close-outline': closeOutline,
    'download-outline': downloadOutline,
    'calendar-outline': calendarOutline,
    'chevron-back-outline': chevronBackOutline,
    'chevron-forward-outline': chevronForwardOutline,
    'funnel-outline': funnelOutline,
    'business-outline': businessOutline,
    'cash-outline': cashOutline,
    'trending-down-outline': trendingDownOutline
  });
}
