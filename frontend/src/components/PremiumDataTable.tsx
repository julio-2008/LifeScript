import React from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { LedgerEntry } from './models';

interface PremiumTableProps {
  title: string;
  data: LedgerEntry[];
  columns: { key: string; label: string; width: string }[];
  onRowPress?: (item: LedgerEntry) => void;
}

export function PremiumDataTable({ title, data, columns, onRowPress }: PremiumTableProps) {
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.tableTitle}>{title}</Text>
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
            <Text style={styles.headerText}>{col.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRow = (item: LedgerEntry) => (
    <View
      key={item.id}
      style={[
        styles.row,
        { borderLeftColor: item.privacy === 'secret' ? '#A78BFA' : '#4F46E5' },
      ]}
    >
      {columns.map((col) => (
        <View key={col.key} style={[styles.cell, { width: col.width }]}>
          <Text
            style={[
              styles.cellText,
              col.key === 'title' && styles.cellTextBold,
            ]}
            numberOfLines={2}
          >
            {String((item as any)[col.key] || '-')}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.tableContent}
        showsVerticalScrollIndicator={false}
      >
        {data.length > 0 ? (
          data.map(renderRow)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum dado disponível</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F0F23',
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0A1A',
    borderBottomWidth: 2,
    borderBottomColor: '#A78BFA',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A78BFA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCell: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7FEA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableContent: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3F',
    borderLeftWidth: 4,
    backgroundColor: '#0F0F23',
  },
  cell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontFamily: 'Menlo',
  },
  cellTextBold: {
    fontWeight: '600',
    color: '#E5E7EB',
  },
  emptyState: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
