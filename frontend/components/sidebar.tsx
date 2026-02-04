"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";

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
  {
    title: "BKB",
    icon: PackageOpen,
    submenu: [
      { title: "Input BKB", href: "/bkb/input" },
      { title: "Monitoring BKB", href: "/bkb/monitoring" },
    ],
  },
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
    const id_peran = user?.id_peran;
    let menu = menuItems;

    if (user && (Number(user.id) === 112 || Number(user.id) === 113)) {
      // Spesifik untuk user IRVAN (113) dan JOHN (112)
      // View Only access for PO
      menu = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "PO (Purchase Order)",
          icon: ShoppingCart,
          submenu: [
            { title: "Monitoring PO", href: "/po/monitoring" },
          ],
        },
        {
          title: "Rekap Keseluruhan",
          href: "/dashboard/rekap-full",
          icon: BarChart3,
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
        {
          title: "Pesanan Anda",
          href: "/divisi/pesanan-anda",
          icon: ShoppingCart,
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
        {
          title: "PO (Purchase Order)",
          icon: ShoppingCart,
          submenu: [
            { title: "Input PO", href: "/po/status" },
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
        {
          title: "BKB",
          icon: PackageOpen,
          submenu: [
            { title: "Input BKB", href: "/bkb/input" },
            { title: "Monitoring BKB", href: "/bkb/monitoring" },
          ],
        },
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
        {
          title: "PR (Purchase Request)",
          icon: FileText,
          submenu: [
            { title: "Input PR", href: "/pr/input-baru" },
            { title: "Monitoring PR", href: "/pr/monitoring" },
          ],
        },
        {
          title: "BKB",
          icon: PackageOpen,
          submenu: [
            { title: "Input BKB", href: "/bkb/input" },
            { title: "Monitoring BKB", href: "/bkb/monitoring" },
          ],
        },
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

  return (
    <div
      className={cn(
        "relative bg-white border-r border-slate-100 flex flex-col h-full transition-all duration-300 shadow-sm z-50",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Centered Toggle Button for User 141 */}
      {isUser141 && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full border-slate-200 shadow-sm z-[60] bg-white hover:bg-slate-50 p-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3 text-slate-500" /> : <ChevronLeft className="h-3 w-3 text-slate-500" />}
        </Button>
      )}

      {/* Header / Logo Area */}
      <div className="flex h-20 items-center px-6 border-b border-slate-50">
        <div className={cn("flex items-center gap-3 w-full", collapsed && "justify-center")}>
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-blue-200 shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-slate-800 tracking-tight">Monitoring</span>
          )}
        </div>
      </div>

      {/* User info simplified or removed if redundant, keeping it simple as per request image */}

      <ScrollArea className="flex-1 py-6 px-4">
        <nav className="space-y-1">
          {filteredMenu.map((item) => {
            const isExpanded = expandedItems.includes(item.title);
            const isActive =
              pathname === item.href ||
              (item.submenu &&
                item.submenu.some((sub) => pathname === sub.href));

            if (item.submenu) {
              if (role && role !== "admin") return null; // Assuming logic
              // Adjusted logic: `role` handling was a bit loose in original, keeping it same.

              return (
                <div key={item.title} className="mb-2">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start relative transition-all duration-200 rounded-xl h-12 px-4 mb-1",
                      isActive
                        ? "bg-blue-50 text-blue-600 font-bold hover:bg-blue-100"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                      collapsed && "justify-center px-0"
                    )}
                    onClick={() => !collapsed && toggleExpanded(item.title)}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-blue-600" : "text-slate-400")} />
                    {!collapsed && (
                      <>
                        <span className="ml-3 text-base">{item.title}</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform text-slate-300",
                            isExpanded && "rotate-90 text-blue-500"
                          )}
                        />
                      </>
                    )}
                  </Button>
                  {/* Submenu */}
                  {!collapsed && (
                    <div
                      className={cn(
                        "ml-4 pl-4 border-l-2 border-slate-100 space-y-1 overflow-hidden transition-all duration-300",
                        isExpanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
                      )}
                    >
                      {isExpanded &&
                        item.submenu.map((subItem) => (
                          <Link key={subItem.href} href={subItem.href} className="block">
                            <div
                              className={cn(
                                "w-full flex items-center h-10 px-4 rounded-lg text-sm transition-all duration-150 cursor-pointer",
                                pathname === subItem.href
                                  ? "bg-blue-600 text-white shadow-md font-medium"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                              )}
                            >
                              {subItem.title}
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="block mb-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start relative transition-all duration-200 rounded-xl h-12 px-4",
                    pathname === item.href
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-white" : "text-slate-400")} />
                  {!collapsed && (
                    <span className="ml-3 text-base">{item.title}</span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Toggle Button at Bottom - Hide for User 141 if they prefer the centered one, or keep both? 
          User said "minimize dengan button di tengah", implying that IS the mechanism. I will hide the bottom one for 141 to avoid clutter. 
      */}
      {!isUser141 && (
        <div className="p-4 border-t border-slate-50">
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Minimize</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}


