import { Component, type ErrorInfo, type ReactNode } from 'react';

import CardLayout from '../Layouts/CardLayout';
import Heading from './Heading';
import Button from './Button';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * 想定外の例外で画面全体が真っ白になるのを防ぐ最後の砦。
 *
 * Reactは描画中に例外が投げられるとツリーごとアンマウントするため、
 * 受け止める側が無いと何も表示されない状態になる。
 * エラー境界はクラスコンポーネントでしか実装できないため、ここだけクラスで書く
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('画面の描画中にエラーが発生しました。', error, errorInfo);
  }

  // 壊れた状態のまま部分的に復帰させると原因が追いにくくなるため、ホームから読み込み直す
  handleGoToHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <CardLayout>
        <div className="text-center">
          <Heading level={2}>予期せぬエラーが発生しました</Heading>
          <p className="mt-2 text-sm text-[#8a8f89] leading-relaxed">
            画面を表示できませんでした。
            <br />
            お手数ですが、はじめからやり直してください。
          </p>
          <Button className="mt-5 w-full" onClick={this.handleGoToHome}>
            ホームへ
          </Button>
        </div>
      </CardLayout>
    );
  }
}

export default ErrorBoundary;
