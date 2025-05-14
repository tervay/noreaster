"use client";

import {
  SheetAlliance,
  SheetAllianceInfo,
  SheetMatch,
  SheetMatchInfo,
} from "@/app/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
    return res.json();
  });

export default function SpreadsheetPage() {
  const { spreadsheetId } = useParams<{ spreadsheetId: string }>();
  const { data, error, isLoading } = useSWR<{
    alliances: SheetAllianceInfo;
    matches: SheetMatchInfo;
  }>(`/api/${spreadsheetId}/data`, fetcher);

  const rankings = useMemo(
    () =>
      data === undefined
        ? []
        : calculateRankings({
            alliances: data.alliances,
            matches: data.matches.matches,
          }),
    [data]
  );

  const allianceLookup =
    data?.alliances.alliances.reduce<Record<string, SheetAlliance>>(
      (acc, alliance) => {
        acc[alliance.index] = alliance;
        return acc;
      },
      {}
    ) ?? {};

  if (isLoading || !data) return <div>Loading...</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div className="grid grid-cols-12 grid-rows-12 gap-4 min-h-screen">
        <div className="col-span-4 row-span-6">
          <Rankings rankings={rankings} allianceLookup={allianceLookup} />
        </div>
        <div className="col-span-4 row-span-6 col-start-1 row-start-7">
          <Schedule matchInfo={data.matches} allianceLookup={allianceLookup} />
        </div>
        <div className="col-span-8 row-span-7 col-start-5 row-start-1">
          <Stream />
        </div>
        <div className="col-span-8 row-span-5 col-start-5 row-start-8">
          Insights
        </div>
      </div>
    </div>
  );
}

function Schedule({
  matchInfo,
  allianceLookup,
}: {
  matchInfo: SheetMatchInfo;
  allianceLookup: Record<string, SheetAlliance>;
}) {
  const nextFewMatches = matchInfo.matches
    .filter(
      (match) =>
        match.blueAlliance.score === "" && match.redAlliance.score === ""
    )
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      {nextFewMatches.map((match) => (
        <FutureMatch
          key={match.matchNumber}
          match={match}
          allianceLookup={allianceLookup}
        />
      ))}
    </div>
  );
}

// https://www.tailwindgen.com/
function FutureMatch({
  match,
  allianceLookup,
}: {
  match: SheetMatch;
  allianceLookup: Record<string, SheetAlliance>;
}) {
  console.log("Looking at ", { allianceLookup });

  console.log(match);
  return (
    <div className="grid grid-cols-6 grid-rows-2 text-center">
      <div className="col-start-2 row-start-1 bg-red-300">
        {allianceLookup[match.redAlliance.allianceIndex].teams[0]}
      </div>
      <div className="col-start-3 row-start-1 bg-red-300">
        {allianceLookup[match.redAlliance.allianceIndex].teams[1]}
      </div>
      <div className="col-start-4 row-start-1 bg-red-300">
        {allianceLookup[match.redAlliance.allianceIndex].teams[2]}
      </div>
      <div className="col-start-5 row-start-1 bg-red-300">
        {allianceLookup[match.redAlliance.allianceIndex].teams[3]}
      </div>
      <div className="col-start-2 row-start-2 bg-blue-300">
        {allianceLookup[match.blueAlliance.allianceIndex].teams[0]}
      </div>
      <div className="col-start-3 row-start-2 bg-blue-300">
        {allianceLookup[match.blueAlliance.allianceIndex].teams[1]}
      </div>
      <div className="col-start-4 row-start-2 bg-blue-300">
        {allianceLookup[match.blueAlliance.allianceIndex].teams[2]}
      </div>
      <div className="col-start-5 row-start-2 bg-blue-300">
        {allianceLookup[match.blueAlliance.allianceIndex].teams[3]}
      </div>
      <div className="row-span-2 col-start-6 row-start-1 flex items-center justify-center">
        {match.time}
      </div>
      <div className="row-span-2 col-start-1 row-start-1 flex items-center justify-center">
        {match.matchNumber}
      </div>
    </div>
  );
}

function Stream() {
  return (
    <div className="text-center flex items-center justify-center min-h-[200px]">
      stream
    </div>
  );
}

interface Ranking {
  allianceIndex: string;
  rankingScore: number;
  averageCoop: number;
  averageMatch: number;
  averageAuto: number;
  averageBarge: number;
  wlt: WLTRecord;
  played: number;
}

interface WLTRecord {
  wins: number;
  losses: number;
  ties: number;
}

function calculateRankings({
  matches,
  alliances,
}: {
  matches: SheetMatch[];
  alliances: SheetAllianceInfo;
}): Ranking[] {
  const rankings: Ranking[] = [];

  alliances.alliances.forEach((alliance) => {
    const ranking: Ranking = {
      allianceIndex: alliance.index,
      rankingScore: 0,
      averageAuto: 0,
      averageBarge: 0,
      averageCoop: 0,
      averageMatch: 0,
      wlt: {
        wins: 0,
        losses: 0,
        ties: 0,
      },
      played: 0,
    };

    const rps: number[] = [];
    const autoScores: number[] = [];
    const bargeScores: number[] = [];
    const coops: boolean[] = [];
    const scores: number[] = [];
    const wlt: WLTRecord = {
      wins: 0,
      losses: 0,
      ties: 0,
    };
    let played = 0;

    matches
      .filter(
        (match) =>
          match.redAlliance.allianceIndex === alliance.index &&
          match.redAlliance.score !== "" &&
          match.blueAlliance.score !== ""
      )
      .forEach((match) => {
        played++;

        autoScores.push(Number(match.redAlliance.autoPoints));
        bargeScores.push(Number(match.redAlliance.bargePoints));
        coops.push(match.coop);
        scores.push(Number(match.redAlliance.score));

        const redScore = Number(match.redAlliance.score);
        const blueScore = Number(match.blueAlliance.score);

        let rp = 0;

        if (redScore > blueScore) {
          wlt.wins++;
          rp += 3;
        } else if (redScore < blueScore) {
          wlt.losses++;
        } else {
          wlt.ties++;
          rp += 1;
        }

        if (match.redAlliance.autoRP) rp++;
        if (match.redAlliance.bargeRP) rp++;
        if (match.redAlliance.coralRP) rp++;

        rps.push(rp);
      });

    matches
      .filter(
        (match) =>
          match.blueAlliance.allianceIndex === alliance.index &&
          match.redAlliance.score !== "" &&
          match.blueAlliance.score !== ""
      )
      .forEach((match) => {
        played++;

        autoScores.push(Number(match.blueAlliance.autoPoints));
        bargeScores.push(Number(match.blueAlliance.bargePoints));
        coops.push(match.coop);
        scores.push(Number(match.blueAlliance.score));

        const blueScore = Number(match.blueAlliance.score);
        const redScore = Number(match.redAlliance.score);

        let rp = 0;

        if (blueScore > redScore) {
          wlt.wins++;
          rp += 3;
        } else if (blueScore < redScore) {
          wlt.losses++;
        } else {
          wlt.ties++;
          rp += 1;
        }

        if (match.blueAlliance.autoRP) rp++;
        if (match.blueAlliance.bargeRP) rp++;
        if (match.blueAlliance.coralRP) rp++;

        rps.push(rp);
      });

    ranking.rankingScore =
      rps.reduce((acc, rp) => acc + rp, 0) / Math.max(played, 1);
    ranking.averageCoop =
      coops.reduce((acc, coop) => acc + (coop ? 1 : 0), 0) /
      Math.max(played, 1);
    ranking.averageMatch =
      scores.reduce((acc, score) => acc + score, 0) / Math.max(played, 1);
    ranking.averageAuto =
      autoScores.reduce((acc, score) => acc + score, 0) / Math.max(played, 1);
    ranking.averageBarge =
      bargeScores.reduce((acc, score) => acc + score, 0) / Math.max(played, 1);
    ranking.played = played;

    rankings.push(ranking);
  });

  rankings.sort(
    (a, b) =>
      b.rankingScore - a.rankingScore ||
      b.averageCoop - a.averageCoop ||
      b.averageMatch - a.averageMatch ||
      b.averageAuto - a.averageAuto ||
      b.averageBarge - a.averageBarge ||
      a.allianceIndex.localeCompare(b.allianceIndex)
  );

  return rankings;
}

function Rankings({
  rankings,
  allianceLookup,
}: {
  rankings: Ranking[];
  allianceLookup: Record<string, SheetAlliance>;
}) {
  return (
    <div className="h-full">
      <Table className="h-full border rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-center">Rank</TableHead>
            <TableHead className="text-center">Alliance</TableHead>
            <TableHead className="text-center">RS</TableHead>
            <TableHead className="text-center">
              Avg
              <br />
              Match
            </TableHead>
            <TableHead className="text-center">
              Avg
              <br />
              Auto
            </TableHead>
            <TableHead className="text-center">
              Avg
              <br />
              Barge
            </TableHead>
            <TableHead className="text-center">WLT</TableHead>
            <TableHead className="text-center">Played</TableHead>
            <TableHead className="text-center">Total RP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((r, i) => (
            <TableRow key={r.allianceIndex} className="text-center">
              <TableCell>{i + 1}</TableCell>
              <TableCell>
                {allianceLookup[r.allianceIndex].teams.join("-")}
              </TableCell>
              <TableCell>{r.rankingScore.toFixed(2)}</TableCell>
              <TableCell>{r.averageMatch.toFixed(2)}</TableCell>
              <TableCell>{r.averageAuto.toFixed(2)}</TableCell>
              <TableCell>{r.averageBarge.toFixed(2)}</TableCell>
              <TableCell>
                {r.wlt.wins}-{r.wlt.losses}-{r.wlt.ties}
              </TableCell>
              <TableCell>{r.played}</TableCell>
              <TableCell>{r.rankingScore * r.played}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
