"use client";

import { useState, useEffect } from "react";
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
      { title: "Hari Libur", href: "/settings/holidays" },
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
  const id_peran = user?.id_peran;
  let filteredMenu = menuItems;

  if (id_peran === 3) {
    // Dashboard, PR, BTB, BKB, Rekap Full
    filteredMenu = [
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
  } else if (id_peran === 4) {
    // Dashboard, PO, Rekap Full
    filteredMenu = [
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
          { title: "Rekap PO", href: "/po/rekap" },
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
  } else if (
    (user &&
      (user.id_peran === 3 || (user.role ?? "").toLowerCase() === "divisi")) ||
    (role && role.toLowerCase() === "divisi")
  ) {
    // Fallback untuk divisi lama
    filteredMenu = [
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

  return (
    <div
      className={cn(
        "relative bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Avatar & Username */}
      <div className="flex flex-col items-center py-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <UserCircle className="h-8 w-8 text-sidebar-foreground" />
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground text-base">
              {user?.nama_pengguna || "User"}
            </span>
          )}
        </div>
      </div>

      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 bg-sidebar">
          <div
            className={cn(
              "flex items-center space-x-2",
              collapsed && "justify-center"
            )}
          >
            {!collapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground">
                Monitoring App
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {filteredMenu.map((item) => {
              const isExpanded = expandedItems.includes(item.title);
              const isActive =
                pathname === item.href ||
                (item.submenu &&
                  item.submenu.some((sub) => pathname === sub.href));

              if (item.submenu) {
                // Untuk divisi, tidak ada submenu
                if (role && role !== "admin") return null;
                return (
                  <div key={item.title}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group relative transition-all duration-200",
                        isActive &&
                        "bg-sidebar-primary text-sidebar-primary-foreground font-bold",
                        collapsed && "justify-center px-2"
                      )}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onClick={() => !collapsed && toggleExpanded(item.title)}
                    >
                      {/* Active bar indicator */}
                      {isActive && !collapsed && (
                        <span
                          className="absolute left-0 top-0 h-full w-1 rounded-r bg-gradient-to-b from-blue-400 to-blue-700"
                          style={{ zIndex: 2 }}
                        />
                      )}
                      <item.icon className="h-4 w-4 z-10" />
                      {!collapsed && (
                        <>
                          <span className="ml-2 z-10">{item.title}</span>
                          <ChevronRight
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform z-10",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </Button>
                    {/* Animated submenu */}
                    {!collapsed && (
                      <div
                        className={cn(
                          "ml-6 overflow-hidden transition-all duration-300",
                          isExpanded
                            ? "max-h-40 opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                        style={{ transitionProperty: "max-height, opacity" }}
                      >
                        {isExpanded &&
                          item.submenu.map((subItem) => (
                            <Link key={subItem.href} href={subItem.href}>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150",
                                  pathname === subItem.href &&
                                  "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                                )}
                                style={{
                                  borderLeft:
                                    pathname === subItem.href
                                      ? "3px solid #3396D3"
                                      : "3px solid transparent",
                                }}
                              >
                                {subItem.title}
                              </Button>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group relative transition-all duration-200",
                      pathname === item.href &&
                      "bg-sidebar-primary text-sidebar-primary-foreground font-bold",
                      collapsed && "justify-center px-2"
                    )}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Active bar indicator */}
                    {pathname === item.href && !collapsed && (
                      <span
                        className="absolute left-0 top-0 h-full w-1 rounded-r bg-gradient-to-b from-blue-400 to-blue-700"
                        style={{ zIndex: 2 }}
                      />
                    )}
                    <item.icon className="h-4 w-4 z-10" />
                    {!collapsed && (
                      <span className="ml-2 z-10">{item.title}</span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}
