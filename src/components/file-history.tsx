
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { File } from "lucide-react";
import { ConversionResult } from "@/app/page";
import { getFileIcon } from "@/lib/icons";

interface FileHistoryProps {
  history: ConversionResult[];
}

export function FileHistory({ history }: FileHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/50 rounded-lg">
        <File className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No Conversion History</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Click "New Conversion" in the top right to start your first file conversion.
        </p>
      </div>
    );
  }

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
