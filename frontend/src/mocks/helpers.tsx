// mocks/socket/ の各ファイルから使うヘルパー

// 現在時刻から指定秒後の ISO 文字列を返却
//
// 回答期限や発言期限は「サーバーが発行した絶対時刻」をフロントがカウントダウンする作りのため、
// 固定の文字列を書くと常に期限切れになってしまう。必ずこの関数で作る。
function afterSeconds(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export { afterSeconds };
