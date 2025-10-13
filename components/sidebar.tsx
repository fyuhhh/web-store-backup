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
      { title: "Status Pencapaian PR", href: "/pr/status" },
      { title: "Rekap PR", href: "/pr/rekap" },
    ],
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
  {
    title: "Biaya Plan",
    href: "/biaya-plan",
    icon: Calculator,
  },
  {
    title: "Rekap Sasaran Mutu",
    href: "/rekap-sasaran-mutu",
    icon: Target,
  },
  {
    title: "Analisa Sasaran Mutu",
    href: "/analisa-sasaran-mutu",
    icon: BarChart3,
  },
  {
    title: "Cost Supplier",
    href: "/cost-supplier",
    icon: DollarSign,
  },
  {
    title: "Data Evaluasi Supplier",
    href: "/evaluasi-supplier",
    icon: Users,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("userData");
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setRole(user.role);
        } catch {}
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

  // Jika divisi, hanya render menu Rekap Keseluruhan
  const filteredMenu =
    role && role !== "admin"
      ? [
          {
            title: "Rekap Keseluruhan",
            href: "/dashboard/rekap-full",
            icon: BarChart3,
          },
        ]
      : menuItems;

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
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
                        "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive &&
                          "bg-sidebar-primary text-sidebar-primary-foreground",
                        collapsed && "justify-center px-2"
                      )}
                      onClick={() => !collapsed && toggleExpanded(item.title)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="ml-2">{item.title}</span>
                          <ChevronRight
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </Button>
                    {!collapsed && isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link key={subItem.href} href={subItem.href}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                pathname === subItem.href &&
                                  "bg-sidebar-primary text-sidebar-primary-foreground"
                              )}
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
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      pathname === item.href &&
                        "bg-sidebar-primary text-sidebar-primary-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">{item.title}</span>}
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
