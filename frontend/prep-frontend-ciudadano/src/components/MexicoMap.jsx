import { useEffect, useState, useRef } from 'react'
import { MapContainer, GeoJSON, ZoomControl, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { partyColors, fieldLabels } from '../utils/labels'

export default function MexicoMap({ data, selectedEntity, onStateSelect }) {
  const [geoData, setGeoData] = useState(null)
  const geoJsonRef = useRef(null) 

  useEffect(() => {
    fetch('/mexico.json')
      .then(res => res.json())
      .then(json => setGeoData(json))
      .catch(err => console.error("Falta el archivo GeoJSON", err))
  }, [])

  const normalizeName = (name) => {
    if (!name) return ''
    let upperName = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (upperName === 'MEXICO') return 'ESTADO DE MEXICO'
    if (upperName === 'CIUDAD DE MEXICO' || upperName === 'DISTRITO FEDERAL' || upperName === 'CDMX') return 'CIUDAD DE MEXICO'
    if (upperName === 'VERACRUZ DE IGNACIO DE LA LLAVE') return 'VERACRUZ'
    if (upperName === 'MICHOACAN DE OCAMPO') return 'MICHOACAN'
    if (upperName === 'COAHUILA DE ZARAGOZA') return 'COAHUILA'
    return upperName
  }

  const dataMap = data.reduce((acc, curr) => {
    const apiNameNormalized = curr.entity.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    acc[apiNameNormalized] = curr
    return acc
  }, {})

  useEffect(() => {
    if (!geoJsonRef.current) return;
    
    const selectedName = selectedEntity ? normalizeName(selectedEntity.entity || selectedEntity.noDataName) : null;

    geoJsonRef.current.eachLayer((layer) => {
      const featureName = normalizeName(layer.feature.properties.NOMGEO);
      
      if (featureName === selectedName) {
         layer.setStyle({ fillOpacity: 1, weight: 2, color: '#333' });
         layer.bringToFront();
      } else {
         layer.setStyle({ fillOpacity: 0.85, weight: 1, color: '#ffffff' });
      }
    });
  }, [selectedEntity]); 

  const styleFeature = (feature) => {
    const entityName = normalizeName(feature.properties.NOMGEO) 
    const entityData = dataMap[entityName]
    
    const winnerColor = entityData?.firstPlace 
      ? (partyColors[entityData.firstPlace.fieldName] || '#94a3b8') 
      : '#e2e8f0' 

    return {
      fillColor: winnerColor,
      weight: 1,
      opacity: 1,
      color: '#ffffff', 
      fillOpacity: 0.85
    }
  }

  const onEachFeature = (feature, layer) => {
    const entityName = normalizeName(feature.properties.NOMGEO)
    const entityData = dataMap[entityName]

    layer.on({
      click: () => {
        if (onStateSelect) {
          onStateSelect(entityData || { entity: feature.properties.NOMGEO, noDataName: feature.properties.NOMGEO, noData: true })
        }
      },
      mouseover: (e) => {
        const target = e.target
        target.setStyle({ fillOpacity: 1, weight: 2, color: '#333' })
        target.bringToFront() 
      },
      mouseout: (e) => {
        const target = e.target
        const selectedName = selectedEntity ? normalizeName(selectedEntity.entity || selectedEntity.noDataName) : null;
        
        if (entityName !== selectedName) {
          target.setStyle({ fillOpacity: 0.85, weight: 1, color: '#ffffff' })
        }
      }
    })
  }

  if (!geoData) {
    return (
      <div className="h-[400px] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)] rounded-xl">
        Cargando mapa...
      </div>
    )
  }

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '0.875rem', overflow: 'hidden', background: 'var(--surface)', position: 'relative' }}>
      <MapContainer 
        center={[23.6345, -102.5528]} 
        zoom={5} 
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        zoomControl={false} 
        scrollWheelZoom={false}
        dragging={true}
      >
        <ZoomControl position="bottomright" />
        <GeoJSON 
          ref={geoJsonRef} 
          data={geoData} 
          style={styleFeature} 
          onEachFeature={onEachFeature} 
        />
      </MapContainer>
    </div>
  )
}