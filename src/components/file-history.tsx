"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { File, Clock, FileText, ImageIcon, CheckCircle, XCircle } from "lucide-react";
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
        <h3 className="mt-4 text-lg font-medium">尚無轉換記錄</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          點擊右上角的「新增轉換」開始您的第一次檔案轉換。
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">類型</TableHead>
            <TableHead>檔名</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>轉換耗時</TableHead>
            <TableHead>轉換時間</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                    {getFileIcon(item.inputFile.name, item.inputFile.type)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.inputFile.name}</TableCell>
              <TableCell>
                {item.status === 'success' ? (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    成功
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                     <XCircle className="mr-1 h-3 w-3" />
                    失敗
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {item.conversionTime ? `${(item.conversionTime / 1000).toFixed(2)} 秒` : '-'}
              </TableCell>
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
