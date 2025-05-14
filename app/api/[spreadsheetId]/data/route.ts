import { NextRequest, NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { SheetAllianceInfo, SheetMatchInfo } from "@/app/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  const { spreadsheetId } = await params;

  const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ];

  const jwt = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY,
    scopes: SCOPES,
  });
  const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
  await doc.loadInfo();

  return NextResponse.json({
    alliances: await getAlliances(doc),
    matches: await getMatches(doc),
  });
}

async function getAlliances(
  doc: GoogleSpreadsheet
): Promise<SheetAllianceInfo> {
  const sheet = doc.sheetsByTitle["Alliances"];
  const rows = await sheet.getRows();

  return {
    alliances: rows.map((row, idx) => ({
      index: (idx + 1).toString(),
      name: row.get("Name"),
      teams: [
        row.get("Team 1"),
        row.get("Team 2"),
        row.get("Team 3"),
        row.get("Team 4"),
      ],
    })),
  };
}

async function getMatches(doc: GoogleSpreadsheet): Promise<SheetMatchInfo> {
  const sheet = doc.sheetsByTitle["Matches"];
  const rows = await sheet.getRows();

  return {
    matches: rows
      .filter((r) => r.get("Blue Raw") !== "")
      .map((row) => ({
        matchNumber: row.get("Match"),
        coop: row.get("Co-op"),
        time: row.get("Time"),
        redAlliance: {
          allianceIndex: row.get("Red Raw"),
          alliancePlayed: [
            row.get("Red 1"),
            row.get("Red 2"),
            row.get("Red 3"),
          ],
          score: row.get("Red Score"),
          autoPoints: row.get("Red Auto Pts"),
          bargePoints: row.get("Red Barge Pts"),
          coralPoints: row.get("Red Coral Pts"),
          autoRP: row.get("Red Auto RP") === "TRUE",
          bargeRP: row.get("Red Barge RP") === "TRUE",
          coralRP: row.get("Red Coral RP") === "TRUE",
        },
        blueAlliance: {
          allianceIndex: row.get("Blue Raw"),
          alliancePlayed: [
            row.get("Blue 1"),
            row.get("Blue 2"),
            row.get("Blue 3"),
          ],
          score: row.get("Blue Score"),
          autoPoints: row.get("Blue Auto Pts"),
          bargePoints: row.get("Blue Barge Pts"),
          coralPoints: row.get("Blue Coral Pts"),
          autoRP: row.get("Blue Auto RP") === "TRUE",
          bargeRP: row.get("Blue Barge RP") === "TRUE",
          coralRP: row.get("Blue Coral RP") === "TRUE",
        },
      })),
  };
}
