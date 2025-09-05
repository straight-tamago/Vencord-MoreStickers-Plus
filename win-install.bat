@echo off
REM
cd /d %~dp0

REM
pnpm install --frozen-lockfile

REM
pnpm build

REM
pnpm inject
