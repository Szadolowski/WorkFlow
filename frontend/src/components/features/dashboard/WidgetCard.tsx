import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ElementType } from "react";

// Definiujemy typy propsów, które nasz komponent może przyjąć
interface WidgetCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  statusType?: "success" | "alert" | "neutral";
  isLoading?: boolean;
}

export function WidgetCard({
  title,
  value,
  subtitle,
  icon: Icon,
  statusType = "neutral",
  isLoading = false,
}: WidgetCardProps) {
  // Słownik przypisujący kolory w zależności od statusu (Zgodnie z Design Systemem)
  const styles = {
    success: {
      card: "",
      text: "text-secondary", // Nasz Teal/Mint
      icon: "text-secondary",
      skeleton: "bg-secondary/20",
    },
    alert: {
      card: "border-destructive/50 bg-destructive/5",
      text: "text-destructive animate-in fade-in zoom-in duration-300", // Nasz Copper/Orange + prosta animacja
      icon: "text-destructive",
      skeleton: "bg-destructive/20",
    },
    neutral: {
      card: "",
      text: "",
      icon: "text-muted-foreground",
      skeleton: "",
    },
  };

  const currentStyle = styles[statusType];

  return (
    <Card className={currentStyle.card}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={`text-sm font-medium ${statusType === "alert" ? "text-destructive" : ""}`}
        >
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${currentStyle.icon}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className={`h-8 w-16 ${currentStyle.skeleton}`} />
        ) : (
          <div className={`text-2xl font-bold ${currentStyle.text}`}>
            {value}
          </div>
        )}
        <p
          className={`text-xs ${statusType === "alert" ? "text-destructive/80" : "text-muted-foreground"}`}
        >
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
