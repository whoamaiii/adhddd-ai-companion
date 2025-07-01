import React from 'react';

// Definerer hvilke "props" komponenten vår forventer
interface HotspotMatrixProps {
  matrix: { [environment: string]: { [behavior: string]: number } };
  behaviors: string[]; // Liste over alle unike atferder
  environments: string[]; // Liste over alle unike miljøer
}

/**
 * En komponent som visualiserer sammenhengen mellom miljøer og atferd
 * som en fargekodet varmematrise (heatmap).
 */
export const HotspotMatrix: React.FC<HotspotMatrixProps> = ({ matrix, behaviors, environments }) => {
  // Finner den høyeste verdien i hele matrisen for å kunne skalere fargene.
  const maxValue = React.useMemo(() => {
    let max = 0;
    Object.values(matrix).forEach(behaviorMap => {
      Object.values(behaviorMap).forEach(count => {
        if (count > max) {
          max = count;
        }
      });
    });
    return max === 0 ? 1 : max; // Unngår divisjon med null
  }, [matrix]);

  // Hvis det ikke er noen data, viser vi en hjelpetekst.
  if (environments.length === 0 || behaviors.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)] text-center py-8">Logg flere øyeblikk med både miljø- og atferds-tags for å se dine "hotspots".</p>;
  }

  return (
    <div className="overflow-x-auto p-1">
      <table className="w-full min-w-[600px] border-collapse text-sm text-left">
        {/* Tabellhode med atferdsnavn */}
        <thead>
          <tr className="border-b border-[var(--border-primary)]">
            <th className="p-2 font-semibold text-[var(--text-secondary)] sticky left-0 bg-[var(--surface-primary)]">Miljø</th>
            {behaviors.map(behavior => (
              <th key={behavior} className="p-2 font-semibold text-center text-[var(--text-secondary)] capitalize" title={behavior}>
                {/* Roterer teksten for å spare plass */}
                <div className="flex justify-center items-end h-24">
                   <span className="transform -rotate-45 origin-bottom-left whitespace-nowrap">{behavior}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Tabellkropp med data */}
        <tbody>
          {environments.map(env => (
            <tr key={env} className="border-b border-[var(--surface-secondary)]">
              {/* Rad-header med miljønavn */}
              <td className="p-2 font-semibold text-[var(--text-primary)] sticky left-0 bg-[var(--surface-primary)] capitalize">{env}</td>
              
              {/* Dataceller med fargekoding */}
              {behaviors.map(beh => {
                const count = matrix[env]?.[beh] || 0;
                // Kalkulerer fargeintensiteten basert på verdien
                const opacity = count > 0 ? 0.2 + (count / maxValue) * 0.8 : 0;
                
                return (
                  <td key={`${env}-${beh}`} className="p-0.5 text-center">
                    <div 
                      className="w-full h-12 flex items-center justify-center rounded-md transition-all"
                      style={{ 
                        backgroundColor: `rgba(12, 146, 242, ${opacity})`, // Bruker --accent-primary fargen med varierende gjennomsiktighet
                        color: opacity > 0.6 ? 'white' : 'var(--text-primary)'
                      }}
                      title={`${count} ${count === 1 ? 'gang' : 'ganger'}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 