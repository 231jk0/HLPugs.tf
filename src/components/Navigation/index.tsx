import * as React from 'react';
import { NavItem } from '../../common/types';
import NavigationItem from './NavigationItem';
import './style.css';

interface NavigationProps {
  navigationGroup: NavItem[];
}

class Navigation extends React.PureComponent<NavigationProps, {}> {
  render() {
    return (
      <nav>
        {this.props.navigationGroup.map((navItem: NavItem, index: number) =>
          <NavigationItem properties={navItem} key={index} />
        )}
      </nav>
    );
  }
}

export default Navigation;