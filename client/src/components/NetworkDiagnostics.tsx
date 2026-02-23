import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, MapPin, Search, ArrowRight, CheckCircle, XCircle } from "lucide-react";

function DnsLookupTab() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<"A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME">("A");
  const [result, setResult] = useState<any>(null);

  const dnsMutation = trpc.diagnostics.dns.useMutation({
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter domain (e.g. google.com)"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === "Enter" && dnsMutation.mutate({ domain, recordType })}
          className="flex-1"
        />
        <Select value={recordType} onValueChange={(v: any) => setRecordType(v)}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["A", "AAAA", "MX", "TXT", "NS", "CNAME"].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => dnsMutation.mutate({ domain, recordType })}
          disabled={dnsMutation.isPending || !domain.trim()}
        >
          {dnsMutation.isPending ? "Looking up..." : "Lookup"}
        </Button>
      </div>

      {result && (
        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{result.domain}</span>
            <Badge variant="outline">{result.recordType} Record</Badge>
          </div>

          {result.ipAddresses.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">Results ({result.ipAddresses.length}):</p>
              <div className="space-y-1">
                {result.ipAddresses.map((ip: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-sm bg-white p-2 rounded border">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {ip}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">No records found</span>
            </div>
          )}

          {result.reverseDns && result.reverseDns.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Reverse DNS:</p>
              {result.reverseDns.map((h: string, i: number) => (
                <p key={i} className="text-sm font-mono text-gray-700">{h}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TracerouteTab() {
  const [host, setHost] = useState("");
  const [result, setResult] = useState<any>(null);

  const traceMutation = trpc.diagnostics.traceroute.useMutation({
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter IP or domain (e.g. 8.8.8.8)"
          value={host}
          onChange={e => setHost(e.target.value)}
          onKeyDown={e => e.key === "Enter" && traceMutation.mutate({ host })}
          className="flex-1"
        />
        <Button
          onClick={() => traceMutation.mutate({ host })}
          disabled={traceMutation.isPending || !host.trim()}
        >
          {traceMutation.isPending ? "Tracing..." : "Trace Route"}
        </Button>
      </div>

      {traceMutation.isPending && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700 text-sm">Tracing route to {host}... This may take up to 60 seconds.</span>
        </div>
      )}

      {result && (
        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Route to {result.host}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{result.totalHops} hops</Badge>
              <Badge className={result.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {result.completed ? "Complete" : "Incomplete"}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            {result.hops.map((hop: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-white rounded border text-sm">
                <span className="w-6 text-center font-mono text-gray-400 text-xs">{hop.hop}</span>
                <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                {hop.timedOut ? (
                  <span className="text-gray-400 italic">* * * (timeout)</span>
                ) : (
                  <>
                    <span className="font-mono flex-1">{hop.ip || "—"}</span>
                    {hop.hostname && hop.hostname !== hop.ip && (
                      <span className="text-gray-500 text-xs">{hop.hostname}</span>
                    )}
                    {hop.latencyMs !== null && (
                      <Badge variant="outline" className="text-xs">
                        {hop.latencyMs.toFixed(1)}ms
                      </Badge>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReverseDnsTab() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<any>(null);

  const reverseMutation = trpc.diagnostics.reverseDns.useMutation({
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter IP address (e.g. 8.8.8.8)"
          value={ip}
          onChange={e => setIp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && reverseMutation.mutate({ ip })}
          className="flex-1"
        />
        <Button
          onClick={() => reverseMutation.mutate({ ip })}
          disabled={reverseMutation.isPending || !ip.trim()}
        >
          {reverseMutation.isPending ? "Looking up..." : "Reverse Lookup"}
        </Button>
      </div>

      {result && (
        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span className="font-mono font-semibold">{result.ip}</span>
          </div>
          {result.hostnames.length > 0 ? (
            <div className="space-y-1">
              {result.hostnames.map((h: string, i: number) => (
                <div key={i} className="flex items-center gap-2 font-mono text-sm bg-white p-2 rounded border">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {h}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">No reverse DNS record found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkDiagnostics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" /> Network Diagnostics
        </CardTitle>
        <CardDescription>DNS lookup, traceroute, and reverse DNS tools for network troubleshooting</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dns">
          <TabsList className="mb-4">
            <TabsTrigger value="dns">DNS Lookup</TabsTrigger>
            <TabsTrigger value="traceroute">Traceroute</TabsTrigger>
            <TabsTrigger value="reverse">Reverse DNS</TabsTrigger>
          </TabsList>
          <TabsContent value="dns">
            <DnsLookupTab />
          </TabsContent>
          <TabsContent value="traceroute">
            <TracerouteTab />
          </TabsContent>
          <TabsContent value="reverse">
            <ReverseDnsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
