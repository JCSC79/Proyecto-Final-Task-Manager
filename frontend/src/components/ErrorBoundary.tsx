import React from 'react';
import { NonIdealState, Button, Intent, Icon } from '@blueprintjs/core';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * ErrorBoundary — catches render errors anywhere in the tree.
 * Prevents a component crash from leaving the user on a blank page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fullPageCenter}>
          <NonIdealState
            icon={<Icon icon="warning-sign" size={60} intent={Intent.DANGER} />}
            title="Something went wrong"
            description={this.state.message || 'An unexpected error occurred.'}
            action={
              <Button intent={Intent.PRIMARY} icon="refresh" onClick={this.handleReload}>
                Reload page
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
