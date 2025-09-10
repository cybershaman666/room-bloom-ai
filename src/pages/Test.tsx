import React from 'react';

const Test = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-primary mb-4">Test Page</h1>
      <p className="text-muted-foreground">
        If you can see this, React is rendering properly.
      </p>
      <div className="mt-4 p-4 bg-card border rounded">
        <p>Card styles are working</p>
      </div>
    </div>
  );
};

export default Test;
