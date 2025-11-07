"use client";

import { Box, Typography, Tooltip } from "@mui/material";
import CalendarHeatmapLib from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { startOfYear, endOfYear } from "date-fns";

interface HeatmapValue {
  date: string;
  count: number;
}

interface CalendarHeatmapProps {
  data: HeatmapValue[];
  title?: string;
}

export default function CalendarHeatmap({ data, title = "Activity Heatmap" }: CalendarHeatmapProps) {
  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());

  return (
    <Box sx={{ p: 3, backgroundColor: "white", borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visualize your daily activity across the year
      </Typography>

      <style>
        {`
          .react-calendar-heatmap {
            width: 100%;
          }
          .react-calendar-heatmap text {
            font-size: 10px;
            fill: #aaa;
          }
          .react-calendar-heatmap .color-empty {
            fill: #eeeeee;
          }
          .react-calendar-heatmap .color-scale-1 {
            fill: #d6e685;
          }
          .react-calendar-heatmap .color-scale-2 {
            fill: #8cc665;
          }
          .react-calendar-heatmap .color-scale-3 {
            fill: #44a340;
          }
          .react-calendar-heatmap .color-scale-4 {
            fill: #1e6823;
          }
          .react-calendar-heatmap rect:hover {
            stroke: #555;
            stroke-width: 1px;
          }
        `}
      </style>

      <CalendarHeatmapLib
        startDate={startDate}
        endDate={endDate}
        values={data}
        classForValue={(value) => {
          if (!value || value.count === 0) {
            return "color-empty";
          }
          if (value.count <= 2) return "color-scale-1";
          if (value.count <= 4) return "color-scale-2";
          if (value.count <= 6) return "color-scale-3";
          return "color-scale-4";
        }}
        tooltipDataAttrs={(value: any) => {
          if (!value || !value.date) {
            return { "data-tip": "No data" };
          }
          return {
            "data-tip": `${value.date}: ${value.count || 0} activities`,
          };
        }}
        showWeekdayLabels={true}
      />

      <Box sx={{ display: "flex", gap: 1, mt: 2, alignItems: "center", justifyContent: "flex-end" }}>
        <Typography variant="caption" color="text.secondary">
          Less
        </Typography>
        {[1, 2, 3, 4].map((level) => (
          <Box
            key={level}
            sx={{
              width: 12,
              height: 12,
              backgroundColor:
                level === 1
                  ? "#d6e685"
                  : level === 2
                  ? "#8cc665"
                  : level === 3
                  ? "#44a340"
                  : "#1e6823",
              borderRadius: 1,
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary">
          More
        </Typography>
      </Box>
    </Box>
  );
}
