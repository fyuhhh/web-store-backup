"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  PackageOpen,
  Calculator,
  Target,
  BarChart3,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Settings,
  ClipboardList,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "PR (Purchase Request)",
    icon: FileText,
    submenu: [
      { title: "Input PR", href: "/pr/input-baru" },
      { title: "Monitoring PR", href: "/pr/monitoring" },
    ],
  },
  {
    title: "PO (Purchase Order)",
    icon: ShoppingCart,
    submenu: [
      { title: "Input PO", href: "/po/status" },
      { title: "Daily Monitoring", href: "/po/daily" },
      { title: "Monitoring PO", href: "/po/monitoring" },
    ],
  },
  {
    title: "BTB",
    icon: Package,
    submenu: [
      { title: "Input BTB", href: "/btb/input" },
      { title: "Monitoring BTB", href: "/btb/monitoring" },
    ],
  },
  // {
  //   title: "BKB",
  //   icon: PackageOpen,
  //   submenu: [
  //     { title: "Input BKB", href: "/bkb/input" },
  //     { title: "Monitoring BKB", href: "/bkb/monitoring" },
  //   ],
  // },
  {
    title: "Rekap Keseluruhan",
    href: "/dashboard/rekap-full",
    icon: BarChart3,
  },
  // {
  //   title: "Biaya Plan",
  //   href: "/biaya-plan",
  //   icon: Calculator,
  // },
  // {
  //   title: "Rekap Sasaran Mutu",
  //   href: "/rekap-sasaran-mutu",
  //   icon: Target,
  // },
  // {
  //   title: "Analisa Sasaran Mutu",
  //   href: "/analisa-sasaran-mutu",
  //   icon: BarChart3,
  // },
  // {
  //   title: "Cost Supplier",
  //   href: "/cost-supplier",
  //   icon: DollarSign,
  // },
  // {
  //   title: "Data Evaluasi Supplier",
  //   href: "/evaluasi-supplier",
  //   icon: Users,
  // },
  {
    title: "Pengaturan",
    icon: Settings,
    submenu: [
      { title: "Hari Libur", href: "/holidays" },
    ],
  },
];

export function Sidebar({ collapsed: externalCollapsed, setCollapsed: setExternalCollapsed }: { collapsed?: boolean, setCollapsed?: (val: boolean) => void } = {}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = setExternalCollapsed !== undefined ? setExternalCollapsed : setInternalCollapsed;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("userData");
      if (userRaw) {
        try {
          const userObj = JSON.parse(userRaw);
          setRole(userObj.role);
          setUser(userObj);
        } catch { }
      }
    }
  }, []);

  // Buka sidebar otomatis setelah login (transisi animasi)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("sidebarShouldOpen") === "true") {
        setCollapsed(true); // Mulai dari collapsed
        setTimeout(() => {
          setCollapsed(false); // Buka dengan animasi
          localStorage.removeItem("sidebarShouldOpen");
        }, 150); // Delay kecil agar transisi terlihat
      }
    }
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  // Filter menu sesuai id_peran
  const filteredMenu = useMemo(() => {
    const id_peran = Number(user?.id_peran);
    let menu = menuItems;

    const mrMenu = {
      title: "MR (Closing Cashier)",
      icon: ClipboardList,
      submenu: [
        { title: "Input MR", href: "/mr/input" },
        { title: "Monitoring MR", href: "/mr/monitoring" },
      ],
    };

    const mrDivisiMenu = {
      title: "Material Request",
      icon: ClipboardList,
      href: "/divisi/mr", // Direct link to Monitoring
    };

    const isRestrictedUser = user && (
      Number(user.id_user || user.id) === 112 || 
      Number(user.id_user || user.id) === 113 || 
      Number(user.id_user || user.id) === 168 || 
      Number(user.id_user || user.id) === 169
    );

    if (isRestrictedUser) {
      // Spesifik untuk user IRVAN (113), JOHN (112), dan Read-Only Users (168, 169)
      // View Only access for PO, PR, BTB, and MR
      menu = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "PR (Purchase Request)",
          icon: FileText,
          submenu: [
            { title: "Monitoring PR", href: "/pr/monitoring" },
          ],
        },
        {
          title: "PO (Purchase Order)",
          icon: ShoppingCart,
          submenu: [
            { title: "Daily Monitoring", href: "/po/daily" },
            { title: "Monitoring PO", href: "/po/monitoring" },
          ],
        },
        {
          title: "BTB",
          icon: Package,
          submenu: [
            { title: "Monitoring BTB", href: "/btb/monitoring" },
          ],
        },
        mrDivisiMenu, // MR Monitoring only link is already in mrDivisiMenu href
        {
          title: "Rekap Keseluruhan",
          href: "/dashboard/rekap-full",
          icon: BarChart3,
        },
      ];
    } else if (id_peran === 1) {
      // ADMIN (Role 1) - Previously fell back to default menuItems
      menu = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        mrMenu,
        {
          title: "PR (Purchase Request)",
          icon: FileText,
          submenu: [
            { title: "Input PR", href: "/pr/input-baru" },
            { title: "Monitoring PR", href: "/pr/monitoring" },
          ],
        },
        {
          title: "PO (Purchase Order)",
          icon: ShoppingCart,
          submenu: [
            { title: "Input PO", href: "/po/status" },
            { title: "Daily Monitoring", href: "/po/daily" },
            { title: "Monitoring PO", href: "/po/monitoring" },
          ],
        },
        {
          title: "BTB",
          icon: Package,
          submenu: [
            { title: "Input BTB", href: "/btb/input" },
            { title: "Monitoring BTB", href: "/btb/monitoring" },
          ],
        },
        // {
        //   title: "BKB",
        //   icon: PackageOpen,
        //   submenu: [
        //     { title: "Input BKB", href: "/bkb/input" },
        //     { title: "Monitoring BKB", href: "/bkb/monitoring" },
        //   ],
        // },
        {
          title: "Rekap Keseluruhan",
          href: "/dashboard/rekap-full",
          icon: BarChart3,
        },
        {
          title: "Pengaturan",
          icon: Settings,
          submenu: [
            { title: "Hari Libur", href: "/holidays" },
          ],
        },
      ];
    } else if (id_peran === 2) {
      // Menu khusus Divisi (id_peran = 2)
      menu = [
        {
          title: "Dashboard",
          href: "/divisi/dashboard",
          icon: LayoutDashboard,
        },
        mrDivisiMenu,
        {
          title: "Pesanan Anda",
          href: "/divisi/pesanan-anda",
          icon: ShoppingCart,
        },
        {
          title: "Monitoring Stok",
          href: "/divisi/monitoring-stok",
          icon: BarChart3,
        },
        {
          title: "Full Rekap",
          href: "/divisi/rekap-full",
          icon: BarChart3,
        },
      ];
    } else if (id_peran === 3) {
      // PURCHASING (Role 3)
      menu = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        mrMenu,
        {
          title: "PO (Purchase Order)",
          icon: ShoppingCart,
          submenu: [
            { title: "Input PO", href: "/po/status" },
            { title: "Daily Monitoring", href: "/po/daily" },
            { title: "Monitoring PO", href: "/po/monitoring" },
          ],
        },
        {
          title: "Rekap Keseluruhan",
          href: "/dashboard/rekap-full",
          icon: BarChart3,
        },
      ];
    } else if (id_peran === 4) {
      // STORE (Role 4)
      menu = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        mrMenu,
        {
          title: "PR (Purchase Request)",
          icon: FileText,
          submenu: [
            { title: "Input PR", href: "/pr/input-baru" },
            { title: "Monitoring PR", href: "/pr/monitoring" },
          ],
        },
        {
          title: "BTB",
          icon: Package,
          submenu: [
            { title: "Input BTB", href: "/btb/input" },
            { title: "Monitoring BTB", href: "/btb/monitoring" },
          ],
        },
        // {
        //   title: "BKB",
        //   icon: PackageOpen,
        //   submenu: [
        //     { title: "Input BKB", href: "/bkb/input" },
        //     { title: "Monitoring BKB", href: "/bkb/monitoring" },
        //   ],
        // },
        {
          title: "Rekap Keseluruhan",
          href: "/dashboard/rekap-full",
          icon: BarChart3,
        },
      ];
    } else if (
      (user &&
        (user.id_peran === 3 || (user.role ?? "").toLowerCase() === "divisi")) ||
      (role && role.toLowerCase() === "divisi")
    ) {
      // Fallback untuk divisi lama
      menu = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        mrDivisiMenu,
        {
          title: "PR (Purchase Request)",
          icon: FileText,
          submenu: [
            { title: "Input PR", href: "/pr/input-baru" },
            { title: "Monitoring PR", href: "/pr/monitoring" },
          ],
        },
        // {
        //   title: "BKB",
        //   icon: PackageOpen,
        //   submenu: [
        //     { title: "Input BKB", href: "/bkb/input" },
        //     { title: "Monitoring BKB", href: "/bkb/monitoring" },
        //   ],
        // },
        {
          title: "Rekap Keseluruhan",
          href: "/dashboard/rekap-full",
          icon: BarChart3,
        },
        {
          title: "Pengaturan",
          icon: Settings,
          submenu: [
            { title: "Hari Libur", href: "/settings/holidays" },
          ],
        },
      ];
    }

    // Tambahan menu Maintenance khusus user ID 141
    const userId = user ? String(user.id ?? user.id_user ?? "") : "";
    if (userId === "141") {
      const extraItems = [
        {
          title: "Mode Maintenance",
          href: "/maintenance/admin",
          icon: Settings,
        }, {
          title: "Broadcast",
          href: "/maintenance/broadcast",
          icon: Users,
        }, {
          title: "Monitoring Akun",
          href: `/monitoring/akun/${userId}`,
          icon: UserCircle,
        }
      ];

      // Insert after Dashboard (which is usually index 0)
      const dashboardIndex = menu.findIndex((item) => item.title === "Dashboard");
      if (dashboardIndex !== -1) {
        const newMenu = [...menu];
        newMenu.splice(dashboardIndex + 1, 0, ...extraItems);
        menu = newMenu;
      } else {
        menu = [...extraItems, ...menu];
      }
    }

    return menu;
  }, [user, role]);

  // Efek untuk otomatis membuka submenu jika item di dalamnya aktif
  useEffect(() => {
    if (!filteredMenu) return;

    // Cari item menu yang submenu-nya memiliki href yang sama dengan pathname saat ini
    const activeParent = filteredMenu.find((item) =>
      item.submenu?.some((sub) => sub.href === pathname)
    );

    if (activeParent) {
      setExpandedItems((prev) => {
        // Jika sudah ada, jangan tambahkan lagi (cegah duplikat)
        if (prev.includes(activeParent.title)) return prev;
        return [...prev, activeParent.title];
      });
    }
  }, [pathname, filteredMenu]);

  const userId = user ? String(user.id ?? user.id_user ?? "") : "";
  const isUser141 = userId === "141";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 288 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative flex flex-col h-full z-50",
        "bg-[#fcfdff] border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      )}
    >
      {/* Floating Toggle Button removed (now controlled via header hamburger) */}

      {/* Subtle Background Accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[80px]" />
      </div>

      {/* Header / Logo Area */}
      <div className="relative flex h-20 items-center px-6 mb-2">
        <div className={cn("flex items-center gap-4 w-full", collapsed && "justify-center")}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200"
          >
            <LayoutDashboard className="h-6 w-6 text-white" />
          </motion.div>
          {!collapsed && (
            <div className="flex flex-col justify-center">
              <span className="text-[22px] font-black tracking-tighter leading-none flex items-center">
                <span className="text-blue-600">Flow</span>
                <span className="text-slate-800">Store</span>
                <span className="text-blue-500 ml-0.5 text-3xl leading-[0px] pb-2">.</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Area */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-4">
          {filteredMenu.map((item) => {
            const isExpanded = expandedItems.includes(item.title);
            const isActive =
              pathname === item.href ||
              (item.submenu &&
                item.submenu.some((sub) => pathname === sub.href));

            if (item.submenu) {
              return (
                <div 
                  key={item.title} 
                  className="group mb-1"
                  onMouseEnter={() => {
                    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
                      if (!collapsed && !expandedItems.includes(item.title)) {
                        setExpandedItems((prev) => [...prev, item.title]);
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
                      if (!collapsed) {
                        const isActiveParent = item.submenu?.some((sub) => pathname === sub.href);
                        if (!isActiveParent) {
                          setExpandedItems((prev) => prev.filter((t) => t !== item.title));
                        }
                      }
                    }
                  }}
                >
                  <button
                    onClick={() => !collapsed && toggleExpanded(item.title)}
                    className={cn(
                      "w-full flex items-center h-11 px-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-all",
                      isActive ? "bg-blue-50 text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {!collapsed && (
                      <>
                        <span className="ml-3 text-sm font-semibold flex-1 text-left">{item.title}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-300 text-slate-400",
                            isExpanded && "rotate-180 text-blue-500"
                          )}
                        />
                      </>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {!collapsed && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "circOut" }}
                        className="overflow-hidden ml-7 mt-1 border-l border-slate-100"
                      >
                        <div className="pl-3 space-y-1 py-1">
                          {item.submenu.map((subItem) => (
                            <Link key={subItem.href} href={subItem.href} className="block">
                              <motion.div
                                whileHover={{ x: 2 }}
                                className={cn(
                                  "relative h-9 px-3 flex items-center text-[13px] font-medium rounded-lg transition-colors",
                                  pathname === subItem.href
                                    ? "text-blue-600 bg-blue-50/50"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                                )}
                              >
                                {pathname === subItem.href && (
                                  <motion.div
                                    layoutId="activeSub"
                                    className="absolute left-[-13px] w-1 h-4 bg-blue-500 rounded-full"
                                  />
                                )}
                                {subItem.title}
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="block mb-1">
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center h-11 px-3 rounded-xl transition-all duration-200 group",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-all",
                    pathname === item.href ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  {!collapsed && (
                    <span className="ml-3 text-sm font-semibold">{item.title}</span>
                  )}
                  {pathname === item.href && !collapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1 h-4 rounded-full bg-blue-500"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile Section */}
      {!collapsed && user?.username && (
        <div className="relative p-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center px-1">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-bold text-slate-800 truncate leading-none">
                {user.username}
              </p>
              {(user.peran || user.role) && (
                <p className="text-[10px] text-slate-400 font-bold truncate mt-1.5 uppercase tracking-wider">
                  {user.peran || user.role}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}


