import React from 'react'
import {
  Map as MapComponent,
  Marker,
  Popup,
  TileLayer,
  Circle,
  ZoomControl,
  ScaleControl,
} from 'react-leaflet'
import Control from 'react-leaflet-control'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import { Typography, useMediaQuery, Tooltip } from '@material-ui/core'
import { GpsFixed, GpsNotFixed } from '@material-ui/icons'
import { Icon, DivIcon } from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-markercluster/dist/styles.min.css'
import ContextMenu from './ContextMenu'
import Legend from './Legend'
import { getIconUrl } from '../utils/helpers'
import exportToKML from '../utils/exportToKML'


const Map = React.forwardRef(({
  center,
  zoom,
  isLocationTabOpen,
  editMode,
  isLoggedIn,
  currentLocation,
  points,
  locationAccuracy,
  updateCoordinates,
  loadMapMarkers,
  setStoredPosition,
  openLocationTab,
  openAddMarkerTab,
  closeTab,
  activeTypes,
  setActiveTypes,
}, ref) => {
  const [activeMarker, setActiveMarker] = React.useState()
  const [contextMenu, setContextMenu] = React.useState()
  const [previousBounds, setPreviousBounds] = React.useState()
  const mapRef = React.useRef()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isPhone = useMediaQuery(theme.breakpoints.down('xs'))
  const classes = useStyles()

  React.useEffect(() => {
    if (activeMarker && !contextMenu) {
      mapRef.current.leafletElement.panTo(activeMarker)
    }
  }, [activeMarker])

  React.useEffect(() => {
    if (center && !activeMarker) {
      mapRef.current.leafletElement.flyTo(center)
    }
  }, [center])

  React.useEffect(() => {
    if (isMobile) {
      mapRef.current.leafletElement.invalidateSize()
    }
  }, [isLocationTabOpen, isMobile])

  // Handle refs.
  React.useImperativeHandle(ref, () => ({
    setActiveMarker(coords) {
      setActiveMarker(coords)
    },
    loadMapMarkers() {
      handleLoadMapMarkers()
    },
  }))

  const handleLoadMapMarkers = async () => {
    const bounds = await mapRef.current.leafletElement.getBounds()
    // Check whether viewport really changed to prevent a multiple calls for the
    // same data.
    if (JSON.stringify(bounds) !== JSON.stringify(previousBounds)) {
      loadMapMarkers(bounds)
      setStoredPosition(mapRef.current.viewport)
      setPreviousBounds(bounds)
    }
  }

  React.useEffect(() => {
    // Refresh markers when active markers are changed.
    const handleAsync = async () => {
      if (mapRef.current.leafletElement._loaded) {
        const bounds = await mapRef.current.leafletElement.getBounds()
        loadMapMarkers(bounds)
        handleLoadMapMarkers()
      }
    }
    handleAsync()
  }, [activeTypes])

  return (
    // Use wrapper to set offset to load markers that are on the edge of a screen.
    <div
      className={classes.offsetWrapper}
      style={isLocationTabOpen && isMobile
        ? isPhone
          ? { height: theme.layout.mobileMiniMapHeight }
          : { marginLeft: theme.layout.locationTabWidth }
        : {}
      }
    >
      <MapComponent
        ref={mapRef}
        className={classes.mapOffset}
        center={center}
        zoom={zoom}
        minZoom={5}
        maxZoom={18}
        maxBounds={[[-90, -180], [90, 180]]}
        zoomControl={false}
        onMoveEnd={() => handleLoadMapMarkers()}
        onContextMenu={e => {
          if (!editMode) {
            if (isLoggedIn) {
              setContextMenu(!contextMenu)
              setActiveMarker(contextMenu ? null : e.latlng)
            }
            closeTab()
          }
        }}
        onClick={e => {
          if (contextMenu) {
            // If context menu is opened, close it.
            setContextMenu(false)
            setActiveMarker(false)
          } else if (editMode && isLoggedIn && !activeMarker) {
            // If location creation form has beem opened from URL and there are no
            // coordinates given yet, set the coordinates and active marker.
            openAddMarkerTab(e.latlng)
            setActiveMarker(e.latlng)
            updateCoordinates(e.latlng)
          } else if (isLocationTabOpen && !editMode) {
            // Dismiss the location details drawer, when clicking on a map.
            closeTab()
            setContextMenu(false)
            setActiveMarker(false)
          }
        }}
      >
        <TileLayer
          url='https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}'
          attribution={`&copy; <a href="https://www.seznam.cz" target="_blank" rel="noopener">Seznam.cz, a.s.</a>, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, &copy; NASA`}
        />
        <MarkerClusterGroup
          showCoverageOnHover={false}
          maxClusterRadius={60}
          disableClusteringAtZoom={11}
          spiderfyOnMaxZoom={false}
          iconCreateFunction={cluster => {
            const count = cluster.getChildCount()
            return new DivIcon({
              html: count,
              className: classes.woodboardCluster,
              iconSize: [40, 40],
            })
          }}
        >
          {points && points.map(item => {
            const { location: { lat, lon }, type } = item

            return <Marker
              key={item.id}
              icon={new Icon({
                iconUrl: getIconUrl(type),
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              })}
              position={[lat, lon]}
              onClick={() => {
                openLocationTab(item)
                setContextMenu(null)
                setActiveMarker([lat, lon])
              }}
              opacity={editMode || item.is_disabled ? 0.5 : 1}
            />
          })}
        </MarkerClusterGroup>
        {activeMarker &&
          <Marker
            icon={new Icon({
              iconUrl: '/location-icons/point.svg',
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })}
            zIndexOffset={1100}
            position={activeMarker}
            draggable={editMode}
            onMoveEnd={e => {
              if (editMode) {
                updateCoordinates(e.target.getLatLng())
              }
            }}
          />
        }
        {activeMarker && contextMenu &&
          <Popup
            position={activeMarker}
            closeButton={false}
            className={classes.popup}
          >
            <ContextMenu addMarker={() => {
              setContextMenu(null)
              openAddMarkerTab(activeMarker)
              mapRef.current.leafletElement.setView(activeMarker)
            }} />
          </Popup>
        }
        {currentLocation &&
          <>
            {locationAccuracy && locationAccuracy > 30 &&
              <Circle
                center={currentLocation}
                radius={locationAccuracy}
              />
            }
            <Marker
              icon={new Icon({
                iconUrl: '/location-icons/current.svg',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
              zIndexOffset={1000}
              position={currentLocation}
            />
          </>
        }
        {(!isLocationTabOpen || !isPhone) &&
          <>
            <ZoomControl position='topright' />
            <Control position='topright' className='leaflet-bar'>
              <a
                className={classes.customControl}
                onClick={() => currentLocation &&
                  mapRef.current.leafletElement.flyTo(currentLocation, 14)
                }
                disabled={!currentLocation}
              >
                {currentLocation
                  ? <GpsFixed className={classes.customControlIcon} />
                  : <GpsNotFixed className={classes.customControlIcon} />
                }
              </a>
            </Control>
            {!editMode &&
              <Control position='topright' className='leaflet-bar'>
                <Tooltip title='Eksportuj aktualny widok do KML' placement='left'>
                  <a
                    className={classes.customControl}
                    onClick={() => exportToKML(points)}
                    disabled={!points || !points.length}
                  >KML</a>
                </Tooltip>
              </Control>
            }
          </>
        }
        <Control position='bottomright'>
          {currentLocation && (!isLocationTabOpen || !isPhone) &&
            <Typography
              component='div'
              variant='caption'
              className={classes.currentLocation}
            >Dokładność GPS: {Math.round(locationAccuracy)} m</Typography>
          }
        </Control>
        <ScaleControl position='bottomright' imperial={false} />
        {!isMobile && !editMode &&
          <Control position='topleft'>
            <Legend
              boxed
              activeTypes={activeTypes}
              onChange={key => setActiveTypes(key)}
            />
          </Control>
        }
      </MapComponent>
    </div>
  )
})

Map.defaultProps = {
  zoom: 7,
}

const useStyles = makeStyles(theme => ({
  offsetWrapper: {
    flexGrow: 1,
    position: 'relative',
  },
  // Map offset to load markers that are on the edge of a screen.
  mapOffset: {
    position: 'absolute',
    top: 0,
    left: theme.spacing(-2),
    bottom: theme.spacing(-4),
    right: theme.spacing(-2),
    // Offset must be compensed on controls.
    '& .leaflet-right': {
      right: theme.spacing(2),
    },
    '& .leaflet-bottom': {
      bottom: theme.spacing(4),
    },
    '& .leaflet-left': {
      left: theme.spacing(2),
    },
    // Add light shadow to all markers.
    '& .leaflet-marker-icon': {
      filter: 'drop-shadow(0 0 1px rgb(0,0,0))',
    },
  },
  woodboardCluster: {
    backgroundColor: 'transparent',
    backgroundImage: 'url(/woodboard.svg)',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#522d19',
    filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))',
  },
  popup: {
    marginBottom: 50,
    '& .leaflet-popup-content-wrapper': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '& .leaflet-popup-content': {
      margin: 0,
      borderRadius: 0,
      border: 'none',
    },
  },
  customControl: {
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&[disabled]': {
      pointerEvents: 'none',
      opacity: 0.33,
    },
  },
  customControlIcon: {
    fontSize: 18,
  },
  currentLocation: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    padding: '0 2px',
    fontSize: 11,
  },
}))

export default Map
