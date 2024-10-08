// assets
import { IconTypography, IconClipboardList, IconChartLine, IconUserSearch, IconFileInvoice, IconPalette, IconShadow, IconWindmill, IconUserPlus, IconPhoneOff } from '@tabler/icons-react';

// constant
const icons = {
  IconTypography,
  IconPalette,
  IconShadow,
  IconWindmill,
  IconUserPlus,
  IconPhoneOff,
  IconUserSearch,
  IconFileInvoice,
  IconChartLine,
  IconClipboardList
};

// ==============================|| UTILITIES MENU ITEMS ||============================== //

const admin_leads = {
  id: 'admin_leads',
  title: 'Leads',
  type: 'group',
  children: [
    {
      id: 'admin-leads',
      title: 'Leads Index',
      type: 'item',
      url: '/leadsIndex',
      icon: icons.IconUserSearch,
      breadcrumbs: false
    },
    {
      id: 'admin-flwleads',
      title: 'Following Leads Index',
      type: 'item',
      url: '/flwLeadsIndex',
      icon: icons.IconUserPlus,
      breadcrumbs: false
    },
    {
      id: 'admin-Allleads',
      title: 'All Leads',
      type: 'item',
      url: '/AllLeads',
      icon: icons.IconClipboardList,
      breadcrumbs: false
    },

    {
      id: 'admin-notcallleads',
      title: 'Not Attended Call Leads',
      type: 'item',
      url: '/NotAttendedcall',
      icon: icons.IconPhoneOff,
      breadcrumbs: false
    },
    {
      id: 'emp-leadsHistory',
      title: 'Leads Invoice History',
      type: 'item',
      url: '/invoiceHistory',
      icon: icons.IconFileInvoice,
      breadcrumbs: false
    }
  ]
};

export default admin_leads;
