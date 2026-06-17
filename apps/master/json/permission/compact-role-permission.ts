// Compact Role Permission Structure
export interface Permission {
  id: string;
  name: string;
  code: string;
  org: string;
  tenant: string;
  active: boolean;
  created: string;
  createdBy: string;
  services: Service[];
  global?: GlobalPerms;
  access?: AccessControl;
}

export interface Service {
  name: string;
  enabled: boolean;
  screens: Screen[];
}

export interface Screen {
  name: string;
  route: string;
  visible: boolean;
  enabled: boolean;
  perms: ScreenPerms;
  comps: Component[];
  nav?: Nav;
}

export interface Component {
  type: string;
  name: string;
  visible: boolean;
  enabled: boolean;
  perms: CompPerms;
  tasks: Task[];
}

export interface Task {
  type: string;
  name: string;
  enabled: boolean;
  approval?: boolean;
  level?: number;
}

export interface ScreenPerms {
  access: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
  create: boolean;
}

export interface CompPerms {
  view: boolean;
  edit: boolean;
  delete: boolean;
  create: boolean;
  export: boolean;
  import: boolean;
}

export interface GlobalPerms {
  users: boolean;
  roles: boolean;
  audit: boolean;
  export: boolean;
  import: boolean;
  admin: boolean;
}

export interface AccessControl {
  scope: 'global' | 'org' | 'dept' | 'loc' | 'user';
  orgs?: string[];
  depts?: string[];
  locs?: string[];
  users?: string[];
  time?: TimeRestrict;
  ip?: string[];
  mfa?: boolean;
}

export interface TimeRestrict {
  hours?: { start: string; end: string };
  days?: string[];
}

export interface Nav {
  menu: boolean;
  order?: number;
  icon?: string;
  parent?: string;
}

// Compact Admin Role
export const adminRole: Permission = {
  id: "686bb4f752f67193f57dc1ae",
  name: "Administrator",
  code: "ECT-CLMS-Admin",
  org: "",
  tenant: "",
  active: true,
  created: "2025-07-07T10:00:00Z",
  createdBy: "Inops",
  global: {
    users: true,
    roles: true,
    audit: true,
    export: true,
    import: true,
    admin: true
  },
  access: {
    scope: 'global',
    time: {
      hours: { start: "00:00", end: "23:59" },
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }
  },
  services: [
    {
      name: "main",
      enabled: true,
      screens: [
        {
          name: "role",
          route: "/role",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: true, delete: true, create: true },
          nav: { menu: true, order: 1, icon: "shield", parent: "admin" },
          comps: []
        },
        {
          name: "home",
          route: "/",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: false, delete: false, create: false },
          nav: { menu: true, order: 0, icon: "home", parent: "main" },
          comps: []
        },
        {
          name: "launchdesk",
          route: "/launchdesk",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: false, delete: false, create: false },
          nav: { menu: true, order: 2, icon: "grid", parent: "main" },
          comps: []
        }
      ]
    },
    {
      name: "reports",
      enabled: true,
      screens: [
        {
          name: "reports",
          route: "/reports/reports",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: true, delete: false, create: true },
          nav: { menu: true, order: 1, icon: "file-text", parent: "reports" },
          comps: [
            {
              type: "reports-header",
              name: "Reports Header",
              visible: true,
              enabled: true,
              perms: { view: true, edit: true, delete: false, create: true, export: true, import: false },
              tasks: [
                { type: "reports-generate", name: "Generate Reports", enabled: true }
              ]
            },
            {
              type: "reports-card",
              name: "Reports Card",
              visible: true,
              enabled: true,
              perms: { view: true, edit: false, delete: false, create: false, export: false, import: false },
              tasks: [
                { type: "reports-status", name: "View Status", enabled: true }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "master",
      enabled: true,
      screens: [
        {
          name: "organization",
          route: "/master/organization",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: true, delete: true, create: true },
          nav: { menu: true, order: 1, icon: "building", parent: "master" },
          comps: [
            {
              type: "organization-header",
              name: "Organization Header",
              visible: true,
              enabled: true,
              perms: { view: true, edit: true, delete: false, create: true, export: true, import: true },
              tasks: [
                { type: "organization-view", name: "View Organization", enabled: true },
                { type: "organization-edit", name: "Edit Organization", enabled: true, approval: true, level: 1 }
              ]
            }
          ]
        },
        {
          name: "location",
          route: "/master/organization/location",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: true, delete: true, create: true },
          nav: { menu: true, order: 2, icon: "map-pin", parent: "master" },
          comps: [
            {
              type: "location-table",
              name: "Location Table",
              visible: true,
              enabled: true,
              perms: { view: true, edit: true, delete: true, create: true, export: true, import: true },
              tasks: [
                { type: "location-add", name: "Add Location", enabled: true },
                { type: "location-edit", name: "Edit Location", enabled: true }
              ]
            }
          ]
        },
        {
          name: "employee",
          route: "/master/company-employee",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: true, delete: true, create: true },
          nav: { menu: true, order: 3, icon: "users", parent: "master" },
          comps: [
            {
              type: "employee-table",
              name: "Employee Table",
              visible: true,
              enabled: true,
              perms: { view: true, edit: true, delete: true, create: true, export: true, import: true },
              tasks: [
                { type: "employee-add", name: "Add Employee", enabled: true },
                { type: "employee-edit", name: "Edit Employee", enabled: true },
                { type: "employee-view", name: "View Employee", enabled: true },
                { type: "employee-delete", name: "Delete Employee", enabled: true, approval: true, level: 2 }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "muster",
      enabled: true,
      screens: [
        {
          name: "punch",
          route: "/muster/punch",
          visible: true,
          enabled: true,
          perms: { access: true, view: true, edit: true, delete: true, create: true },
          nav: { menu: true, order: 1, icon: "clock", parent: "muster" },
          comps: [
            {
              type: "punch-form",
              name: "Punch Form",
              visible: true,
              enabled: true,
              perms: { view: true, edit: true, delete: false, create: true, export: false, import: false },
              tasks: [
                { type: "punch-in", name: "Punch In", enabled: true },
                { type: "punch-out", name: "Punch Out", enabled: true },
                { type: "punch-apply", name: "Apply Punch", enabled: true },
                { type: "punch-approve", name: "Approve Punch", enabled: true, approval: true, level: 1 }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Utility Functions
export const PermUtils = {
  // Check task permission
  canTask: (role: Permission, service: string, screen: string, comp: string, task: string): boolean => {
    const srv = role.services.find(s => s.name === service);
    const scr = srv?.screens.find(sc => sc.name === screen);
    const cmp = scr?.comps.find(c => c.type === comp);
    const tsk = cmp?.tasks.find(t => t.type === task);
    return tsk?.enabled || false;
  },

  // Check screen permission
  canScreen: (role: Permission, service: string, screen: string, perm: keyof ScreenPerms): boolean => {
    const srv = role.services.find(s => s.name === service);
    const scr = srv?.screens.find(sc => sc.name === screen);
    return scr?.perms[perm] || false;
  },

  // Check global permission
  canGlobal: (role: Permission, perm: keyof GlobalPerms): boolean => {
    return role.global?.[perm] || false;
  },

  // Get accessible screens
  getScreens: (role: Permission): Array<{service: string, screen: Screen}> => {
    const screens: Array<{service: string, screen: Screen}> = [];
    role.services.forEach(srv => {
      srv.screens.forEach(scr => {
        if (scr.perms.access && scr.visible && scr.enabled) {
          screens.push({ service: srv.name, screen: scr });
        }
      });
    });
    return screens;
  },

  // Check time access
  canAccess: (role: Permission): boolean => {
    const time = role.access?.time;
    if (!time) return true;

    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    if (time.hours && (hour < time.hours.start || hour > time.hours.end)) return false;
    if (time.days && !time.days.includes(day)) return false;

    return true;
  }
};

export default adminRole;


