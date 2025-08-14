
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConversionResult } from "@/app/page";
import { getFileIcon } from "@/lib/icons";

interface FileHistoryProps {
  history: ConversionResult[];
}

export function FileHistory({ history }: FileHistoryProps) {
  // Create a Set of seen IDs to filter out duplicates
  const seen = new Set();
  const uniqueHistory = history.filter(item => {
    const duplicate = seen.has(item.id);
    seen.add(item.id);
    return !duplicate;
  });

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Conversion Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {uniqueHistory.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                    {getFileIcon(item.inputFile.name, item.inputFile.type)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.inputFile.name}</TableCell>
              <TableCell>
                {new Date().toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
