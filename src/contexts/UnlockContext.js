import PropTypes from 'prop-types';
import React, { useMemo, useState, createContext } from 'react';

export const UnlockContext = createContext({});

export const UnlockProvider = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false);
  const value = useMemo(() => ({ unlocked, setUnlocked }), [unlocked]);

  return <UnlockContext.Provider value={value}>{children}</UnlockContext.Provider>;
};

UnlockProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
